import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { sessionOptions, SessionData } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ 
      success: true,
      user: {
        preferredTheme: user.preferredTheme,
        preferredLocale: user.preferredLocale,
      },
    })
    response.cookies.set("NEXT_LOCALE", user.preferredLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    })

    const session = await getIronSession<SessionData>(request, response, sessionOptions)
    
    session.userId = user.id
    session.email = user.email
    session.isLoggedIn = true
    await session.save()

    return response
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
