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
      redirect("/") // Or a 403 page
  }

  const usersData = await prisma.user.findMany({
    orderBy: { name: "asc" },
  })

  // Serialize dates
  const users = usersData.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString()
  }))

  return <UsersClientPage users={users} isAdmin={currentUser.role === "ADMIN"} />
}
