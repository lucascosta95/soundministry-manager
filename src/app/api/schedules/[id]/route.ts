import {NextRequest, NextResponse} from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { date: 'asc' },
          include: {
            assignments: {
              include: {
                operator: true
              }
            }
          }
        }
      }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(schedule)
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
    await prisma.schedule.delete({
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    const schedule = await prisma.schedule.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(schedule)
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating schedule status" },
      { status: 500 }
    )
  }
}
