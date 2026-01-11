import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const operatorSchema = z.object({
  name: z.string().min(1),
  birthday: z.string(),
  monthlyAvailability: z.number().min(1),
  weeklyAvailability: z.array(z.string()),
  annualAvailability: z.array(z.string()),
  canWorkAlone: z.boolean().default(false),
})

export async function GET() {
  try {
    const operators = await prisma.soundOperator.findMany({
      orderBy: { name: "asc" },
    })
    return NextResponse.json(operators)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch operators" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = operatorSchema.parse(body)

    const operator = await prisma.soundOperator.create({
      data: {
        ...validatedData,
        birthday: new Date(validatedData.birthday),
      },
    })

    return NextResponse.json(operator, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create operator" },
      { status: 500 }
    )
  }
}
