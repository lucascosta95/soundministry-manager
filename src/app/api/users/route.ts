import {NextRequest, NextResponse} from "next/server"
import {getIronSession} from "iron-session"
import {SessionData, sessionOptions} from "@/lib/session"
import {prisma} from "@/lib/prisma"
import {z} from "zod"
import bcrypt from "bcryptjs"

const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || ""

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
})

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

export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.next()
    const authCheck = await checkAdminPermission(request, response)

    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        preferredTheme: true,
        preferredLocale: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.next()
    const authCheck = await checkAdminPermission(request, response)

    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const body = await request.json()
    const validatedData = userSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    const password = validatedData.password || DEFAULT_PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        preferredTheme: true,
        preferredLocale: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
}
