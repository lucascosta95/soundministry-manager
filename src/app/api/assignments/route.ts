import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, operatorId } = body

    if (!eventId || !operatorId) {
      return NextResponse.json(
        { error: "Event ID and Operator ID are required" },
        { status: 400 }
      )
    }

    // Verificar se já existe assignment
    const existingAssignment = await prisma.scheduleAssignment.findUnique({
      where: {
        eventId_operatorId: {
          eventId,
          operatorId
        }
      }
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Operator already assigned to this event" },
        { status: 400 }
      )
    }

    const assignment = await prisma.scheduleAssignment.create({
      data: {
        eventId,
        operatorId,
        isManual: true
      },
      include: {
        operator: true
      }
    })

    return NextResponse.json(assignment)
  } catch (error) {
    console.error("Error creating assignment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
