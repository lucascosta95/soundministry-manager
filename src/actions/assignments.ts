"use server"

import {prisma} from "@/lib/prisma"
import {revalidatePath} from "next/cache"
import {getIronSession} from "iron-session"
import {cookies} from "next/headers"
import {SessionData, sessionOptions} from "@/lib/session"

async function checkAuth() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn) {
        throw new Error("Unauthorized")
    }
}

export async function createAssignment(eventId: string, operatorId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await checkAuth()

        if (!eventId || !operatorId) {
            return { success: false, error: "Event ID and Operator ID are required" }
        }

        const existingAssignment = await prisma.scheduleAssignment.findUnique({
            where: {
                eventId_operatorId: {
                    eventId,
                    operatorId
                }
            }
        })

        if (existingAssignment) {
            return { success: false, error: "Operator already assigned to this event" }
        }

        await prisma.scheduleAssignment.create({
            data: {
                eventId,
                operatorId,
                isManual: true
            }
        })

        revalidatePath(`/schedules`) // Invalidate all schedules to be safe or specific schedule if we had ID
        // Since we don't have schedule ID easily here, and revalidatePath works on path, invalidating /schedules/[id] would require finding schedule ID.
        // But since the page uses dynamic ID, we can't easily revalidate specific one without query.
        // However, usually revalidatePath updates the current page if called from it.
        
        // Let's find the schedule ID to be precise
        const event = await prisma.scheduleEvent.findUnique({
            where: { id: eventId },
            select: { scheduleId: true }
        })
        
        if (event) {
            revalidatePath(`/schedules/${event.scheduleId}`)
        }

        return { success: true }
    } catch (error: any) {
        console.error("Create assignment error:", error)
        return { success: false, error: error.message || "Failed to create assignment" }
    }
}

export async function deleteAssignment(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await checkAuth()
        
        // Find schedule ID before deleting for revalidation
        const assignment = await prisma.scheduleAssignment.findUnique({
            where: { id },
            include: {
                event: {
                    select: { scheduleId: true }
                }
            }
        })

        if (!assignment) {
            return { success: false, error: "Assignment not found" }
        }

        await prisma.scheduleAssignment.delete({
            where: { id },
        })

        revalidatePath(`/schedules/${assignment.event.scheduleId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Delete assignment error:", error)
        return { success: false, error: error.message || "Failed to delete assignment" }
    }
}
