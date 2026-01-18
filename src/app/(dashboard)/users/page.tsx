import {prisma} from "@/lib/prisma"
import UsersClientPage from "@/components/users/users-client-page"
import {getIronSession} from "iron-session"
import {cookies} from "next/headers"
import {SessionData, sessionOptions} from "@/lib/session"
import {redirect} from "next/navigation"

export default async function UsersPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  
  if (!session.isLoggedIn || !session.userId) {
      redirect("/login")
  }

  const currentUser = await prisma.user.findUnique({ where: { id: session.userId } })
  
  if (currentUser?.role !== "ADMIN") {
      redirect("/")
  }

  const usersData = await prisma.user.findMany({
    orderBy: { name: "asc" },
  })

  const users = usersData.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString()
  }))

  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || "SoundMinistry@2026"

  return <UsersClientPage users={users} defaultPassword={defaultPassword} />
}
