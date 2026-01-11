import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { sessionOptions, SessionData } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const DEFAULT_PASSWORD = "SoundMinistry@2024"

async function checkAdminPermission(request: NextRequest, response: NextResponse) {
  const session = await getIronSession<SessionData>(request, response, sessionOptions)

  if (!session.userId) {
    return { authorized: false, status: 401, error: "Unauthorized" }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  })

  if (!user || user.role !== "ADMIN") {
    return { authorized: false, status: 403, error: "Forbidden: Admin access required" }
  }

  return { authorized: true, user }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const response = NextResponse.next()
    const authCheck = await checkAdminPermission(request, response)

    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const { id } = await params

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ 
      success: true,
      message: `Password reset to: ${DEFAULT_PASSWORD}`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}
