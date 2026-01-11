import {prisma} from "@/lib/prisma"
import {ScheduleDetails, ScheduleWithDetails} from "@/components/schedules/schedule-details"
import {getTranslations} from "next-intl/server"
import {Button} from "@/components/ui/button"
import {ArrowLeft} from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SchedulePage({ params }: PageProps) {
  const { id } = await params
  const t = await getTranslations("schedules")

  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: {
      events: {
        orderBy: { date: 'asc' },
        include: {
          assignments: {
            include: {
              operator: true
            }
          }
        }
      }
    }
  })

  if (!schedule) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <h2 className="text-xl font-semibold">{t("scheduleNotFound")}</h2>
        <Button asChild>
          <Link href="/schedules">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToSchedules")}
          </Link>
        </Button>
      </div>
    )
  }

  const operators = await prisma.soundOperator.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  })

  // Serialize dates for Client Component
  const serializedSchedule: ScheduleWithDetails = {
    ...schedule,
    events: schedule.events.map(event => ({
      ...event,
      date: event.date.toISOString(),
      assignments: event.assignments.map(assignment => ({
        ...assignment,
        operator: {
          id: assignment.operator.id,
          name: assignment.operator.name,
          canWorkAlone: assignment.operator.canWorkAlone
        }
      }))
    }))
  }

  return <ScheduleDetails schedule={serializedSchedule} operators={operators} />
}
