import {prisma} from "@/lib/prisma"
import {PublicScheduleView, ScheduleWithDetails} from "@/components/schedules/public-schedule-view"
import {notFound} from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PublicSchedulePage({ params }: PageProps) {
  const { id } = await params
  
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
    notFound()
  }

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

  return (
    <div className="container mx-auto py-10 px-4">
      <PublicScheduleView schedule={serializedSchedule} />
    </div>
  )
}
