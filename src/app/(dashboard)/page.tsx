import {getIronSession} from "iron-session"
import {cookies} from "next/headers"
import {SessionData, sessionOptions} from "@/lib/session"
import {prisma} from "@/lib/prisma"
import DashboardClientPage from "@/components/dashboard/dashboard-client-page"
import {redirect} from "next/navigation"

export default async function DashboardPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  
  if (!session.isLoggedIn || !session.userId) {
      redirect("/login")
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const [
    operatorsCount,
    pairsCount,
    restrictionsCount,
    user,
    currentSchedule
  ] = await Promise.all([
    prisma.soundOperator.count(),
    prisma.preferredPair.count(),
    prisma.monthlyRestriction.count(),
    prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true }
    }),
    prisma.schedule.findFirst({
        where: {
            month: currentMonth,
            year: currentYear
        },
        include: {
            events: {
                orderBy: { date: 'asc' },
                include: {
                    assignments: {
                        include: {
                            operator: {
                                select: { name: true }
                            }
                        }
                    }
                }
            }
        }
    })
  ])

  // Serializar datas do schedule
  const serializedSchedule = currentSchedule ? {
      ...currentSchedule,
      events: currentSchedule.events.map(event => ({
          ...event,
          date: event.date.toISOString()
      }))
  } : null

  return (
    <DashboardClientPage
      stats={{
          operators: operatorsCount,
          pairs: pairsCount,
          restrictions: restrictionsCount
      }}
      userName={user?.name || "User"}
      currentSchedule={serializedSchedule}
    />
  )
}
