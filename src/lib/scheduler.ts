import {ServiceDay, SoundOperator} from "@prisma/client"
import {prisma} from "@/lib/prisma"
import {differenceInDays, subMonths} from "date-fns"
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

interface OperatorWithRelations extends SoundOperator {
  pairsAsFirst: any[]
  pairsAsSecond: any[]
  monthlyRestrictions: any[]
}

interface PairCompatibility {
  pairId: string
  operator1Id: string
  operator2Id: string
  operator1: OperatorWithRelations
  operator2: OperatorWithRelations
  type: 'FULL' | 'PARTIAL'
  compatibleServiceDayIds: string[]
  compatibleWeekDays: number[]
}

interface OperatorStats {
  operatorId: string
  totalAllocations: number
  lastWorkedDate: Date | null
  daysSinceLastWork: number
  currentMonthAllocations: number
}

interface AllocationOption {
  type: 'PAIR' | 'INDIVIDUAL'
  operatorIds: string[]
  operators: OperatorWithRelations[]
  score: number
  isPairFull?: boolean
  pairId?: string
}

export async function generateSchedule({ month, year, locale }: SchedulerOptions): Promise<SchedulerResult> {
  const t = await getTranslations({ locale, namespace: "scheduler" })
  const logs: string[] = []
  logs.push(t("starting", { month, year }))

  try {
    // ============================================
    // 1. VALIDAÇÕES INICIAIS
    // ============================================
    const existingSchedule = await prisma.schedule.findUnique({
      where: { month_year: { month, year } }
    })

    if (existingSchedule) {
      return { success: false, error: t("alreadyExists"), logs }
    }

    // ============================================
    // 2. CARREGAR DADOS NECESSÁRIOS
    // ============================================
    logs.push("📦 Carregando dados do banco...")

    const serviceDays = await prisma.serviceDay.findMany()
    const operators = await prisma.soundOperator.findMany({
      include: {
        pairsAsFirst: {
          include: {
            secondOperator: {
              include: {
                pairsAsFirst: true,
                pairsAsSecond: true,
                monthlyRestrictions: { where: { month, year } }
              }
            }
          }
        },
        pairsAsSecond: {
          include: {
            firstOperator: {
              include: {
                pairsAsFirst: true,
                pairsAsSecond: true,
                monthlyRestrictions: { where: { month, year } }
              }
            }
          }
        },
        monthlyRestrictions: { where: { month, year } }
      }
    })

    const preferredPairs = await prisma.preferredPair.findMany({
      include: {
        firstOperator: {
          include: {
            monthlyRestrictions: { where: { month, year } }
          }
        },
        secondOperator: {
          include: {
            monthlyRestrictions: { where: { month, year } }
          }
        }
      }
    })

    logs.push(`✅ ${operators.length} operadores carregados`)
    logs.push(`✅ ${serviceDays.length} dias de culto configurados`)
    logs.push(`✅ ${preferredPairs.length} duplas preferenciais`)

    // ============================================
    // 3. ANÁLISE DE HISTÓRICO (últimos 6 meses)
    // ============================================
    logs.push("📊 Analisando histórico dos últimos 6 meses...")

    const targetDate = new Date(year, month - 1, 1)
    const historyStartDate = subMonths(targetDate, 6)

    const historicalAllocations = await prisma.scheduleAssignment.findMany({
      where: {
        event: {
          schedule: {
            status: "PUBLISHED",
            OR: [
              {
                year: { gte: historyStartDate.getFullYear() },
                month: { gte: historyStartDate.getMonth() + 1 }
              }
            ]
          },
          date: { gte: historyStartDate, lt: targetDate }
        }
      },
      include: {
        event: true
      }
    })

    // Criar estatísticas por operador
    const operatorStats = new Map<string, OperatorStats>()

    operators.forEach(op => {
      operatorStats.set(op.id, {
        operatorId: op.id,
        totalAllocations: 0,
        lastWorkedDate: null,
        daysSinceLastWork: 999999,
        currentMonthAllocations: 0
      })
    })

    // Processar histórico
    historicalAllocations.forEach(allocation => {
      const stats = operatorStats.get(allocation.operatorId)!
      stats.totalAllocations++

      if (!stats.lastWorkedDate || allocation.event.date > stats.lastWorkedDate) {
        stats.lastWorkedDate = allocation.event.date
      }
    })

    // Calcular dias desde última escalação
    operatorStats.forEach(stats => {
      if (stats.lastWorkedDate) {
        stats.daysSinceLastWork = differenceInDays(targetDate, stats.lastWorkedDate)
      }
    })

    logs.push(`✅ Histórico processado: ${historicalAllocations.length} alocações analisadas`)

    // ============================================
    // 4. ANÁLISE DE COMPATIBILIDADE DE DUPLAS
    // ============================================
    logs.push("🤝 Analisando compatibilidade de duplas...")

    const pairCompatibilities: PairCompatibility[] = []

    for (const pair of preferredPairs) {
      const op1 = operators.find(o => o.id === pair.firstOperatorId)!
      const op2 = operators.find(o => o.id === pair.secondOperatorId)!

      // Encontrar service days onde ambos estão disponíveis
      const compatibleServiceDayIds: string[] = []
      const compatibleWeekDays: number[] = []

      serviceDays.forEach(sd => {
        const op1Available = op1.weeklyAvailability.includes(sd.id) ||
          op1.weeklyAvailability.includes(getDayName(sd.weekDay))
        const op2Available = op2.weeklyAvailability.includes(sd.id) ||
          op2.weeklyAvailability.includes(getDayName(sd.weekDay))

        if (op1Available && op2Available) {
          compatibleServiceDayIds.push(sd.id)
          if (!compatibleWeekDays.includes(sd.weekDay)) {
            compatibleWeekDays.push(sd.weekDay)
          }
        }
      })

      // Verificar se meses são compatíveis
      const monthName = getMonthName(month)
      const op1MonthAvailable = op1.annualAvailability.includes(monthName)
      const op2MonthAvailable = op2.annualAvailability.includes(monthName)

      if (!op1MonthAvailable || !op2MonthAvailable) {
        logs.push(`⚠️ Dupla ${op1.name} + ${op2.name} não disponível neste mês`)
        continue
      }

      // Determinar tipo de compatibilidade
      const allServiceDayIds = serviceDays.map(sd => sd.id)
      const op1AvailableAll = allServiceDayIds.filter(id => op1.weeklyAvailability.includes(id))
      const op2AvailableAll = allServiceDayIds.filter(id => op2.weeklyAvailability.includes(id))

      const type = (op1AvailableAll.length === op2AvailableAll.length &&
        compatibleServiceDayIds.length === op1AvailableAll.length)
        ? 'FULL' : 'PARTIAL'

      pairCompatibilities.push({
        pairId: pair.id,
        operator1Id: op1.id,
        operator2Id: op2.id,
        operator1: op1,
        operator2: op2,
        type,
        compatibleServiceDayIds,
        compatibleWeekDays
      })

      logs.push(`${type === 'FULL' ? '💯' : '⚡'} Dupla ${op1.name} + ${op2.name} (${type === 'FULL' ? 'Sempre juntos' : 'Parcialmente compatíveis'})`)
    }

    // ============================================
    // 5. GERAR EVENTOS DO MÊS
    // ============================================
    logs.push("📅 Gerando eventos do mês...")

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

    events.sort((a, b) => a.date.getTime() - b.date.getTime())
    logs.push(`✅ ${events.length} eventos gerados para o mês`)

    // ============================================
    // 6. CRIAR ESCALA NO BANCO
    // ============================================
    const schedule = await prisma.schedule.create({
      data: {
        month,
        year,
        status: "DRAFT",
      }
    })

    logs.push(`📋 Escala criada (ID: ${schedule.id})`)

    // ============================================
    // 7. PROCESSAR CADA EVENTO
    // ============================================
    logs.push("🎯 Iniciando alocação de operadores...")

    const allocationSummary: { [key: string]: number } = {}
    operators.forEach(op => allocationSummary[op.name] = 0)

    for (let eventIndex = 0; eventIndex < events.length; eventIndex++) {
      const event = events[eventIndex]
      const eventDateStr = event.date.toISOString().split('T')[0]

      logs.push(`\n📌 Evento ${eventIndex + 1}/${events.length}: ${event.serviceDay.name} - ${eventDateStr}`)

      // Criar evento no banco
      const scheduleEvent = await prisma.scheduleEvent.create({
        data: {
          scheduleId: schedule.id,
          date: event.date,
          name: event.serviceDay.name,
          minOperators: event.serviceDay.minSoundOperators,
          maxOperators: event.serviceDay.maxSoundOperators,
        }
      })

      // Filtrar candidatos elegíveis
      const eligibleCandidates = operators.filter(op => {
        const stats = operatorStats.get(op.id)!

        // Verificar disponibilidade mensal máxima
        if (stats.currentMonthAllocations >= op.monthlyAvailability) {
          return false
        }

        // Verificar restrição de datas específicas
        const restriction = op.monthlyRestrictions[0]
        if (restriction && restriction.restrictedDays.includes(event.date.getDate())) {
          return false
        }

        // Verificar disponibilidade semanal
        const dayName = getDayName(event.date.getDay())
        const isAvailableById = op.weeklyAvailability.includes(event.serviceDay.id)
        const isAvailableByDayName = op.weeklyAvailability.includes(dayName)

        if (!isAvailableById && !isAvailableByDayName) {
          return false
        }

        // Verificar disponibilidade anual
        const monthName = getMonthName(month)
        if (!op.annualAvailability.includes(monthName)) {
          return false
        }

        // Evitar trabalhar em dias consecutivos
        if (stats.lastWorkedDate) {
          const daysDiff = differenceInDays(event.date, stats.lastWorkedDate)
          if (daysDiff === 0 || daysDiff === 1) {
            return false
          }
        }

        return true
      })

      logs.push(`   ✓ ${eligibleCandidates.length} candidatos elegíveis`)

      if (eligibleCandidates.length === 0) {
        logs.push(`   ⚠️ ALERTA: Nenhum candidato disponível para este evento!`)
        continue
      }

      // ============================================
      // NOVA ABORDAGEM: Sistema Híbrido de Alocação
      // ============================================

      const allocated: string[] = []
      const allocationOptions: AllocationOption[] = []

      // Montar opções de alocação (duplas + individuais)
      while (allocated.length < event.serviceDay.maxSoundOperators) {
        allocationOptions.length = 0 // Limpar array

        // Candidatos ainda não alocados
        const remainingCandidates = eligibleCandidates.filter(op => !allocated.includes(op.id))

        if (remainingCandidates.length === 0) break

        // OPÇÃO 1: Duplas preferenciais disponíveis
        for (const pair of pairCompatibilities) {
          if (!pair.compatibleServiceDayIds.includes(event.serviceDay.id)) continue

          const op1Available = remainingCandidates.some(c => c.id === pair.operator1Id)
          const op2Available = remainingCandidates.some(c => c.id === pair.operator2Id)

          if (op1Available && op2Available && (allocated.length + 2) <= event.serviceDay.maxSoundOperators) {
            const stats1 = operatorStats.get(pair.operator1Id)!
            const stats2 = operatorStats.get(pair.operator2Id)!

            // Score da dupla = média dos scores individuais + bonus
            const score1 = calculateOperatorScore(pair.operator1, stats1)
            const score2 = calculateOperatorScore(pair.operator2, stats2)
            const avgScore = (score1 + score2) / 2

            // Bonus para duplas: FULL=500, PARTIAL=200
            const pairBonus = pair.type === 'FULL' ? 500 : 200
            const totalScore = avgScore + pairBonus

            allocationOptions.push({
              type: 'PAIR',
              operatorIds: [pair.operator1Id, pair.operator2Id],
              operators: [pair.operator1, pair.operator2],
              score: totalScore,
              isPairFull: pair.type === 'FULL',
              pairId: pair.pairId
            })
          }
        }

        // OPÇÃO 2: Operadores individuais
        for (const candidate of remainingCandidates) {
          const stats = operatorStats.get(candidate.id)!

          // Verificar se pode trabalhar sozinho (se for o único)
          const needsSoloCapable = event.serviceDay.minSoundOperators === 1 && allocated.length === 0
          if (needsSoloCapable && !candidate.canWorkAlone) {
            continue
          }

          const score = calculateOperatorScore(candidate, stats)

          allocationOptions.push({
            type: 'INDIVIDUAL',
            operatorIds: [candidate.id],
            operators: [candidate],
            score: score
          })
        }

        // Se não tem nenhuma opção, sair
        if (allocationOptions.length === 0) break

        // Ordenar por score (maior primeiro)
        allocationOptions.sort((a, b) => b.score - a.score)

        // Escolher a melhor opção
        const bestOption = allocationOptions[0]

        // Alocar!
        for (const opId of bestOption.operatorIds) {
          await allocateOperator(scheduleEvent.id, opId, operatorStats, event.date)
          allocated.push(opId)
          const op = operators.find(o => o.id === opId)!
          allocationSummary[op.name]++
        }

        // Log da alocação
        if (bestOption.type === 'PAIR') {
          const names = bestOption.operators.map(o => o.name).join(' + ')
          const typeEmoji = bestOption.isPairFull ? '💯' : '⚡'
          logs.push(`   ${typeEmoji} Dupla alocada: ${names} (score: ${Math.round(bestOption.score)})`)
        } else {
          const op = bestOption.operators[0]
          const stats = operatorStats.get(op.id)!
          logs.push(`   👤 Individual alocado: ${op.name} (score: ${Math.round(bestOption.score)}, dias: ${stats.daysSinceLastWork})`)
        }

        // Se já atingiu o máximo, parar
        if (allocated.length >= event.serviceDay.maxSoundOperators) break
      }

      // Verificar se conseguiu alocar o mínimo
      if (allocated.length < event.serviceDay.minSoundOperators) {
        logs.push(`   ❌ AVISO: Apenas ${allocated.length}/${event.serviceDay.minSoundOperators} operadores alocados!`)
      } else {
        logs.push(`   ✅ ${allocated.length}/${event.serviceDay.maxSoundOperators} operadores alocados com sucesso`)
      }
    }

    // ============================================
    // 8. RESUMO FINAL
    // ============================================
    logs.push("\n" + "=".repeat(50))
    logs.push("📊 RESUMO DA ESCALA")
    logs.push("=".repeat(50))

    const sortedSummary = Object.entries(allocationSummary).sort((a, b) => b[1] - a[1])
    sortedSummary.forEach(([name, count]) => {
      logs.push(`   ${name}: ${count} escalações`)
    })

    logs.push("\n✅ " + t("success"))
    return { success: true, scheduleId: schedule.id, logs }

  } catch (error: any) {
    console.error(error)
    logs.push("\n❌ " + t("error", { message: error.message }))
    return { success: false, error: error.message, logs }
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function calculateOperatorScore(operator: OperatorWithRelations, stats: OperatorStats): number {
  // Score baseado em:
  // 1. Dias desde última escalação (mais tempo = maior prioridade)
  // 2. Total de alocações históricas (menos alocações = maior prioridade)
  // 3. Alocações no mês atual (menos alocações = maior prioridade)

  const daysScore = stats.daysSinceLastWork * 100
  const totalScore = Math.max(0, (50 - stats.totalAllocations)) * 20
  const monthScore = (operator.monthlyAvailability - stats.currentMonthAllocations) * 50

  return daysScore + totalScore + monthScore
}

async function allocateOperator(
  eventId: string,
  operatorId: string,
  statsMap: Map<string, OperatorStats>,
  eventDate: Date
) {
  await prisma.scheduleAssignment.create({
    data: {
      eventId,
      operatorId,
      isManual: false
    }
  })

  const stats = statsMap.get(operatorId)!
  stats.currentMonthAllocations++
  stats.totalAllocations++
  stats.lastWorkedDate = eventDate
  stats.daysSinceLastWork = 0
}

function getDayName(day: number): string {
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
  return days[day]
}

function getMonthName(month: number): string {
  const months = ["", "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]
  return months[month]
}