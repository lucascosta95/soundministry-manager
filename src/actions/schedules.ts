"use server"

import {prisma} from "@/lib/prisma"
import {z} from "zod"
import {revalidatePath} from "next/cache"
import {getIronSession} from "iron-session"
import {cookies} from "next/headers"
import {SessionData, sessionOptions} from "@/lib/session"
import {generateSchedule} from "@/lib/scheduler"

const generateSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2024),
})

async function checkAuth() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn) {
        throw new Error("Unauthorized")
    }
    return session
}

export type ScheduleState = {
    success?: boolean
    error?: string
    logs?: string[]
    validationErrors?: Record<string, string[] | undefined>
}

export async function generateScheduleAction(prevState: ScheduleState, formData: FormData): Promise<ScheduleState> {
    try {
        await checkAuth()
        const locale = (await cookies()).get("NEXT_LOCALE")?.value || process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "pt-BR"

        const rawData = {
            month: Number(formData.get("month")),
            year: Number(formData.get("year")),
        }

        const validatedData = generateSchema.safeParse(rawData)

        if (!validatedData.success) {
            return {
                success: false,
                validationErrors: validatedData.error.flatten().fieldErrors,
                error: "Validation failed"
            }
        }

        const { month, year } = validatedData.data

        const existing = await prisma.schedule.findUnique({
            where: { month_year: { month, year } }
        })

        if (existing) {
            return { success: false, error: "Schedule already exists for this month/year" }
        }

        const generationResult = await generateSchedule({ month, year, locale })

        if (!generationResult.success) {
            return { 
                success: false, 
                error: generationResult.error || "Failed to generate schedule",
                logs: generationResult.logs 
            }
        }

        revalidatePath("/schedules")
        return { success: true, logs: generationResult.logs }

    } catch (error: any) {
        console.error("Generate schedule error:", error)
        return { success: false, error: error.message || "Internal server error" }
    }
}

export async function deleteScheduleAction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await checkAuth()
        await prisma.schedule.delete({
            where: { id },
        })
        revalidatePath("/schedules")
        revalidatePath("/") // Update dashboard as well
        return { success: true }
    } catch (error) {
        console.error("Delete schedule error:", error)
        return { success: false, error: "Failed to delete schedule" }
    }
}

export async function updateScheduleStatus(id: string, status: string): Promise<{ success: boolean; error?: string }> {
    try {
        await checkAuth()
        await prisma.schedule.update({
            where: { id },
            data: { status },
        })
        revalidatePath(`/schedules/${id}`)
        revalidatePath("/schedules")
        return { success: true }
    } catch (error) {
        console.error("Update schedule status error:", error)
        return { success: false, error: "Failed to update schedule status" }
    }
}
