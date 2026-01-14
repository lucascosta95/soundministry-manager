import {prisma} from "@/lib/prisma"
import SchedulesClientPage from "@/components/schedules/schedules-client-page"

export default async function SchedulesPage() {
  const schedules = await prisma.schedule.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      _count: {
        select: { events: true },
      },
    },
  })

  return <SchedulesClientPage schedules={schedules} />
}
