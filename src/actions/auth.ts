"use server"

import {prisma} from "@/lib/prisma"
import {cookies} from "next/headers"
import {getIronSession} from "iron-session"
import {SessionData, sessionOptions} from "@/lib/session"
import bcrypt from "bcryptjs"

export type AuthState = {
  success?: boolean
  error?: string
  user?: {
    preferredTheme?: string
    preferredLocale?: string
  }
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  try {
    const email = String(formData.get("email") || "")
    const password = String(formData.get("password") || "")

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return { success: false, error: "Invalid credentials" }
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return { success: false, error: "Invalid credentials" }
    }

    const cookieStore = await cookies()
    if (user.preferredLocale) {
      cookieStore.set("NEXT_LOCALE", user.preferredLocale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      })
    }

    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    session.userId = user.id
    session.email = user.email
    session.isLoggedIn = true
    await session.save()

    return {
      success: true,
      user: {
        preferredTheme: user.preferredTheme,
        preferredLocale: user.preferredLocale,
      },
    }
  } catch (error: any) {
    return { success: false, error: error?.message || "Internal server error" }
  }
}

export async function logout(): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    session.destroy()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Internal server error" }
  }
}

export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies()
  return await getIronSession<SessionData>(cookieStore, sessionOptions)
}
