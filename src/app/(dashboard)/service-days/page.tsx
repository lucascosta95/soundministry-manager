import {prisma} from "@/lib/prisma"
import ServiceDaysClientPage from "@/components/service-days/service-days-client-page"
import {getIronSession} from "iron-session"
import {cookies} from "next/headers"
import {SessionData, sessionOptions} from "@/lib/session"
import {redirect} from "next/navigation"

export default async function ServiceDaysPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  
  if (!session.isLoggedIn || !session.userId) {
      redirect("/login")
  }

  const serviceDays = await prisma.serviceDay.findMany({
    orderBy: [
      { weekDay: 'asc' },
      { name: 'asc' }
    ]
  })

  return <ServiceDaysClientPage serviceDays={serviceDays} />
}
