import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const operatorSchema = z.object({
  name: z.string().min(1),
  birthday: z.string(),
  monthlyAvailability: z.number().min(1),
  weeklyAvailability: z.array(z.enum(["WEDNESDAY", "SATURDAY", "SUNDAY"])),
  annualAvailability: z.array(z.string()),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const operator = await prisma.soundOperator.findUnique({
      where: { id },
    })

    if (!operator) {
      return NextResponse.json(
        { error: "Operator not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(operator)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch operator" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = operatorSchema.parse(body)

    const operator = await prisma.soundOperator.update({
      where: { id },
      data: {
        ...validatedData,
        birthday: new Date(validatedData.birthday),
      },
    })

    return NextResponse.json(operator)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update operator" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.soundOperator.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete operator" },
      { status: 500 }
    )
  }
}
