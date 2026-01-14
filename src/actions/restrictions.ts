"use server"

import {prisma} from "@/lib/prisma"
import {z} from "zod"
import {revalidatePath} from "next/cache"
import {getIronSession} from "iron-session"
import {cookies} from "next/headers"
import {SessionData, sessionOptions} from "@/lib/session"

const restrictionSchema = z.object({
  operatorId: z.string().min(1),
  month: z.number().min(1).max(12),
  year: z.number().min(2024),
  restrictedDays: z.array(z.number()),
})

async function checkAuth() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn) {
        throw new Error("Unauthorized")
    }
}

export type RestrictionState = {
    success?: boolean
    error?: string
    validationErrors?: Record<string, string[] | undefined>
}

export async function createRestriction(prevState: RestrictionState, formData: FormData): Promise<RestrictionState> {
    try {
        await checkAuth()

        const rawData = {
            operatorId: formData.get("operatorId"),
            month: Number(formData.get("month")),
            year: Number(formData.get("year")),
            restrictedDays: JSON.parse(formData.get("restrictedDays") as string || "[]"),
        }

        const validatedData = restrictionSchema.safeParse(rawData)

        if (!validatedData.success) {
            return {
                success: false,
                validationErrors: validatedData.error.flatten().fieldErrors,
                error: "Validation failed"
            }
        }

        const { operatorId, month, year, restrictedDays } = validatedData.data

        const existing = await prisma.monthlyRestriction.findFirst({
            where: {
                operatorId,
                month,
                year,
            },
        })

        if (existing) {
            return { success: false, error: "Restriction already exists" }
        }

        await prisma.monthlyRestriction.create({
            data: {
                operatorId,
                month,
                year,
                restrictedDays,
            },
        })

        revalidatePath("/restrictions")
        return { success: true }

    } catch (error) {
        console.error("Create restriction error:", error)
        return { success: false, error: "Failed to create restriction" }
    }
}

export async function updateRestriction(id: string, prevState: RestrictionState, formData: FormData): Promise<RestrictionState> {
    try {
        await checkAuth()

        const rawData = {
            operatorId: formData.get("operatorId"),
            month: Number(formData.get("month")),
            year: Number(formData.get("year")),
            restrictedDays: JSON.parse(formData.get("restrictedDays") as string || "[]"),
        }

        const validatedData = restrictionSchema.safeParse(rawData)

        if (!validatedData.success) {
            return {
                success: false,
                validationErrors: validatedData.error.flatten().fieldErrors,
                error: "Validation failed"
            }
        }

        const { month, year, restrictedDays } = validatedData.data

        await prisma.monthlyRestriction.update({
            where: { id },
            data: {
                month,
                year,
                restrictedDays,
            },
        })

        revalidatePath("/restrictions")
        return { success: true }

    } catch (error) {
        console.error("Update restriction error:", error)
        return { success: false, error: "Failed to update restriction" }
    }
}

export async function deleteRestriction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await checkAuth()
        await prisma.monthlyRestriction.delete({
            where: { id },
        })
        revalidatePath("/restrictions")
        return { success: true }
    } catch (error) {
        console.error("Delete restriction error:", error)
        return { success: false, error: "Failed to delete restriction" }
    }
}
