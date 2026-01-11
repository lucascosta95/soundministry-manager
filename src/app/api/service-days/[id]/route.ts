import {NextRequest, NextResponse} from "next/server"
import {prisma} from "@/lib/prisma"
import {z} from "zod"

const serviceDaySchema = z.object({
  name: z.string().min(1),
  weekDay: z.number().min(0).max(6),
  minSoundOperators: z.number().min(1),
  maxSoundOperators: z.number().min(1),
}).refine(data => data.maxSoundOperators >= data.minSoundOperators, {
  message: "Max operators must be greater than or equal to min operators",
  path: ["maxSoundOperators"],
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const result = serviceDaySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      )
    }

    const { name, weekDay, minSoundOperators, maxSoundOperators } = result.data

    const serviceDay = await prisma.serviceDay.update({
      where: { id },
      data: {
        name,
        weekDay,
        minSoundOperators,
        maxSoundOperators,
      },
    })

    return NextResponse.json(serviceDay)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
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
    await prisma.serviceDay.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
