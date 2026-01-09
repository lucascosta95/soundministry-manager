import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const pairSchema = z.object({
  firstOperatorId: z.string(),
  secondOperatorId: z.string(),
})

async function checkCompatibility(firstId: string, secondId: string) {
  const [first, second] = await Promise.all([
    prisma.soundOperator.findUnique({ where: { id: firstId } }),
    prisma.soundOperator.findUnique({ where: { id: secondId } }),
  ])

  if (!first || !second) {
    return { compatible: false, reason: "Operator not found" }
  }

  const weeklyIntersection = first.weeklyAvailability.filter((day) =>
    second.weeklyAvailability.includes(day)
  )

  if (weeklyIntersection.length === 0) {
    return { compatible: false, reason: "No weekly availability overlap" }
  }

  const annualIntersection = first.annualAvailability.filter((month) =>
    second.annualAvailability.includes(month)
  )

  if (annualIntersection.length === 0) {
    return { compatible: false, reason: "No annual availability overlap" }
  }

  return { compatible: true   }
}

export async function GET() {
  try {
    const pairs = await prisma.preferredPair.findMany({
      include: {
        firstOperator: true,
        secondOperator: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(pairs)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch pairs" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = pairSchema.parse(body)

    if (validatedData.firstOperatorId === validatedData.secondOperatorId) {
      return NextResponse.json(
        { error: "Operators must be different" },
        { status: 400 }
      )
    }

    const compatibility = await checkCompatibility(
      validatedData.firstOperatorId,
      validatedData.secondOperatorId
    )

    if (!compatibility.compatible) {
      return NextResponse.json(
        { error: compatibility.reason },
        { status: 400 }
      )
    }

    const existingPair = await prisma.preferredPair.findFirst({
      where: {
        OR: [
          {
            firstOperatorId: validatedData.firstOperatorId,
            secondOperatorId: validatedData.secondOperatorId,
          },
          {
            firstOperatorId: validatedData.secondOperatorId,
            secondOperatorId: validatedData.firstOperatorId,
          },
        ],
      },
    })

    if (existingPair) {
      return NextResponse.json(
        { error: "Pair already exists" },
        { status: 400 }
      )
    }

    const pair = await prisma.preferredPair.create({
      data: validatedData,
      include: {
        firstOperator: true,
        secondOperator: true,
      },
    })

    return NextResponse.json(pair, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create pair" },
      { status: 500 }
    )
  }
}
