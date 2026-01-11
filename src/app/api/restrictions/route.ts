import {NextRequest, NextResponse} from "next/server"
import {prisma} from "@/lib/prisma"
import {z} from "zod"

const restrictionSchema = z.object({
  operatorId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number(),
  restrictedDays: z.array(z.number().min(1).max(31)),
})

export async function GET() {
  try {
    const restrictions = await prisma.monthlyRestriction.findMany({
      include: {
        operator: true,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    })
    return NextResponse.json(restrictions)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch restrictions" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = restrictionSchema.parse(body)

    const existing = await prisma.monthlyRestriction.findUnique({
      where: {
        operatorId_month_year: {
          operatorId: validatedData.operatorId,
          month: validatedData.month,
          year: validatedData.year,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Restriction already exists for this month/year" },
        { status: 400 }
      )
    }

    const restriction = await prisma.monthlyRestriction.create({
      data: validatedData,
      include: {
        operator: true,
      },
    })

    return NextResponse.json(restriction, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create restriction" },
      { status: 500 }
    )
  }
}
