import {NextRequest, NextResponse} from "next/server"
import {prisma} from "@/lib/prisma"
import {generateSchedule} from "@/lib/scheduler"
import {z} from "zod"

const generateSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2024),
})

export async function GET() {
  try {
    const schedules = await prisma.schedule.findMany({
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ],
      include: {
        _count: {
          select: { events: true }
        }
      }
    })
    return NextResponse.json(schedules)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = generateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      )
    }

    const { month, year } = result.data

    const existing = await prisma.schedule.findUnique({
      where: { month_year: { month, year } }
    })

    if (existing) {
      return NextResponse.json(
        { error: "Schedule already exists for this month/year" },
        { status: 409 }
      )
    }

    const locale = request.cookies.get("NEXT_LOCALE")?.value || process.env.NEXT_PUBLIC_DEFAULT_LOCALE || ""
    const generationResult = await generateSchedule({ month, year, locale })

    if (!generationResult.success) {
      return NextResponse.json(
        { error: generationResult.error, logs: generationResult.logs },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      scheduleId: generationResult.scheduleId,
      logs: generationResult.logs 
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
