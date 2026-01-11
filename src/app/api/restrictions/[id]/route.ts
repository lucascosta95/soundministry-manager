import {NextRequest, NextResponse} from "next/server"
import {prisma} from "@/lib/prisma"
import {z} from "zod"

const restrictionSchema = z.object({
  operatorId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number(),
  restrictedDays: z.array(z.number().min(1).max(31)),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const restriction = await prisma.monthlyRestriction.findUnique({
      where: { id },
      include: {
        operator: true,
      },
    })

    if (!restriction) {
      return NextResponse.json(
        { error: "Restriction not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(restriction)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch restriction" },
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
    const validatedData = restrictionSchema.parse(body)

    const restriction = await prisma.monthlyRestriction.update({
      where: { id },
      data: validatedData,
      include: {
        operator: true,
      },
    })

    return NextResponse.json(restriction)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update restriction" },
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
    await prisma.monthlyRestriction.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete restriction" },
      { status: 500 }
    )
  }
}
