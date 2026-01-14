import {prisma} from "@/lib/prisma"
import {getIronSession} from "iron-session"
import {cookies} from "next/headers"
import {SessionData, sessionOptions} from "@/lib/session"
import {redirect} from "next/navigation"
import ProfileClientPage from "@/components/profile/profile-client-page"

export default async function ProfilePage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  
  if (!session.isLoggedIn || !session.userId) {
      redirect("/login")
  }

  const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
          id: true,
          name: true,
          email: true,
          role: true,
          preferredTheme: true,
          preferredLocale: true
      }
  })

  if (!user) {
      redirect("/login")
  }

  // Ensure all values are strings to match the interface and prevent serialization issues
  const safeUser = {
      ...user,
      preferredTheme: user.preferredTheme || "system",
      preferredLocale: user.preferredLocale || "pt-BR"
  }

  return <ProfileClientPage initialProfile={safeUser} />
}
