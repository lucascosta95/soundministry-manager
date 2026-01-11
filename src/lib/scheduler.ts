import {ServiceDay, SoundOperator} from "@prisma/client"
import {prisma} from "@/lib/prisma"
import {isSameDay, subDays, subMonths} from "date-fns"
import {getTranslations} from "next-intl/server"

interface SchedulerOptions {
  month: number
  year: number
  locale: string
}

interface SchedulerResult {
  success: boolean
  scheduleId?: string
  error?: string
  logs: string[]
}

export async function generateSchedule({ month, year, locale }: SchedulerOptions): Promise<SchedulerResult> {
  const t = await getTranslations({ locale, namespace: "scheduler" })
  const logs: string[] = []
  logs.push(t("starting", { month, year }))

  try {
    const existingSchedule = await prisma.schedule.findUnique({
      where: { month_year: { month, year } }
    })

    if (existingSchedule) {
      return { success: false, error: t("alreadyExists"), logs }
    }

    const serviceDays = await prisma.serviceDay.findMany()
    const operators = await prisma.soundOperator.findMany({
      include: {
        pairsAsFirst: true,
        pairsAsSecond: true,
        monthlyRestrictions: {
          where: { month, year }
        }
      }
    })
    const preferredPairs = await prisma.preferredPair.findMany()
    
    const targetDate = new Date(year, month - 1, 1)
    const historyStartDate = subMonths(targetDate, 6)
    const previousMonthEndDate = subDays(targetDate, 1)
    const previousMonthStartDate = subDays(targetDate, 7)

    const pastStats = await prisma.scheduleAssignment.groupBy({
      by: ['operatorId'],
      where: {
        event: {
          schedule: {
            status: "PUBLISHED",
            month: { gte: historyStartDate.getMonth() + 1 },
            year: { gte: historyStartDate.getFullYear() }
          },
          date: { gte: historyStartDate }
        }
      },
      _count: true
    })

    const allocationsCount = new Map<string, number>()
    
    operators.forEach(op => {
      const stats = pastStats.find(s => s.operatorId === op.id)
      allocationsCount.set(op.id, stats?._count || 0)
    })

    const lastMonthEvents = await prisma.scheduleEvent.findMany({
      where: {
        date: {
          gte: previousMonthStartDate,
          lte: previousMonthEndDate
        },
        schedule: {
          status: "PUBLISHED"
        }
      },
      include: {
        assignments: true
      }
    })

    const lastWorkedDate = new Map<string, Date>()
    
    lastMonthEvents.forEach(event => {
      event.assignments.forEach(assign => {
        const existingDate = lastWorkedDate.get(assign.operatorId)
        if (!existingDate || event.date > existingDate) {
          lastWorkedDate.set(assign.operatorId, event.date)
        }
      })
    })

    const currentMonthAllocations = new Map<string, number>()
    operators.forEach(op => currentMonthAllocations.set(op.id, 0))

    const events: { date: Date; serviceDay: ServiceDay }[] = []
    const daysInMonth = new Date(year, month, 0).getDate()
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const weekDay = date.getDay()

      const services = serviceDays.filter(sd => sd.weekDay === weekDay)
      for (const service of services) {
        events.push({ date, serviceDay: service })
      }
    }

    logs.push(t("generatedEvents", { count: events.length }))

    const schedule = await prisma.schedule.create({
      data: {
        month,
        year,
        status: "DRAFT",
      }
    })

    for (const event of events) {
      const scheduleEvent = await prisma.scheduleEvent.create({
        data: {
          scheduleId: schedule.id,
          date: event.date,
          name: event.serviceDay.name,
          minOperators: event.serviceDay.minSoundOperators,
          maxOperators: event.serviceDay.maxSoundOperators,
        }
      })

      let candidates = operators.filter(op => {
        if ((currentMonthAllocations.get(op.id) || 0) >= op.monthlyAvailability) return false

        const restriction = op.monthlyRestrictions[0]
        if (restriction && restriction.restrictedDays.includes(event.date.getDate())) return false

        const dayName = getDayName(event.date.getDay())
        const isAvailableById = op.weeklyAvailability.includes(event.serviceDay.id)
        const isAvailableByDayName = op.weeklyAvailability.includes(dayName)
        
        if (!isAvailableById && !isAvailableByDayName) return false

        const monthName = getMonthName(month)
        if (!op.annualAvailability.includes(monthName)) return false

        const lastDate = lastWorkedDate.get(op.id)
        if (lastDate) {
          const yesterday = subDays(event.date, 1)
          if (isSameDay(lastDate, yesterday)) return false
          if (isSameDay(lastDate, event.date)) return false
        }

        return true
      })

      candidates.sort((a, b) => {
        const allocA = allocationsCount.get(a.id) || 0
        const allocB = allocationsCount.get(b.id) || 0
        if (allocA !== allocB) return allocA - allocB
        return Math.random() - 0.5
      })

      const allocated: SoundOperator[] = []
      const needed = event.serviceDay.minSoundOperators
      
      const availableCandidates = [...candidates]

      const pairMap = new Map<string, string>()
      preferredPairs.forEach(p => {
        pairMap.set(p.firstOperatorId, p.secondOperatorId)
        pairMap.set(p.secondOperatorId, p.firstOperatorId)
      })

      while (allocated.length < needed && availableCandidates.length > 0) {
        let bestCandidateIndex = -1

        bestCandidateIndex = availableCandidates.findIndex(candidate => {
          if (allocated.length === 0 && needed === 1 && !candidate.canWorkAlone) {
            return false
          }

          const partnerId = pairMap.get(candidate.id)
          if (partnerId) {
            const isPartnerAvailable = availableCandidates.some(op => op.id === partnerId)
            
            if (!isPartnerAvailable) return false

            const remainingSlots = event.serviceDay.maxSoundOperators - allocated.length
            if (remainingSlots < 2) {
              return false
            }
          }

          return true
        })

        if (bestCandidateIndex !== -1) {
          const candidate = availableCandidates[bestCandidateIndex]
          
          allocated.push(candidate)
          
          currentMonthAllocations.set(candidate.id, (currentMonthAllocations.get(candidate.id) || 0) + 1)
          allocationsCount.set(candidate.id, (allocationsCount.get(candidate.id) || 0) + 1)
          lastWorkedDate.set(candidate.id, event.date)

          await prisma.scheduleAssignment.create({
            data: {
              eventId: scheduleEvent.id,
              operatorId: candidate.id,
              isManual: false
            }
          })

          availableCandidates.splice(bestCandidateIndex, 1)

          if (allocated.length < event.serviceDay.maxSoundOperators) {
            const partnerId = pairMap.get(candidate.id)
            if (partnerId) {
              const partnerIndex = availableCandidates.findIndex(op => op.id === partnerId)
              
              if (partnerIndex !== -1) {
                const partner = availableCandidates[partnerIndex]
                allocated.push(partner)
                
                currentMonthAllocations.set(partner.id, (currentMonthAllocations.get(partner.id) || 0) + 1)
                allocationsCount.set(partner.id, (allocationsCount.get(partner.id) || 0) + 1)
                lastWorkedDate.set(partner.id, event.date)

                await prisma.scheduleAssignment.create({
                  data: {
                    eventId: scheduleEvent.id,
                    operatorId: partner.id,
                    isManual: false
                  }
                })

                availableCandidates.splice(partnerIndex, 1)
              }
            }
          }

        } else {
          break
        }
      }

      if (allocated.length < event.serviceDay.minSoundOperators) {
        logs.push(t("minOperatorsWarning", {
          date: event.date.toISOString().split('T')[0],
          service: event.serviceDay.name,
          allocated: allocated.length,
          needed: event.serviceDay.minSoundOperators
        }))
      }
    }

    logs.push(t("success"))
    return { success: true, scheduleId: schedule.id, logs }

  } catch (error: any) {
    console.error(error)
    logs.push(t("error", { message: error.message }))
    return { success: false, error: error.message, logs }
  }
}

function getDayName(day: number): string {
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
  return days[day]
}

function getMonthName(month: number): string {
  const months = ["", "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]
  return months[month]
}
