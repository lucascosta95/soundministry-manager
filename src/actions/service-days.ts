"use server"

import {prisma} from "@/lib/prisma"
import {z} from "zod"
import {revalidatePath} from "next/cache"
import {getIronSession} from "iron-session"
import {cookies} from "next/headers"
import {SessionData, sessionOptions} from "@/lib/session"

const serviceDaySchema = z.object({
  name: z.string().min(1),
  weekDay: z.number().min(0).max(6),
  minSoundOperators: z.number().min(1),
  maxSoundOperators: z.number().min(1),
}).refine(data => data.maxSoundOperators >= data.minSoundOperators, {
  message: "Max operators must be greater than or equal to min operators",
  path: ["maxSoundOperators"],
})

async function checkAuth() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn) {
        throw new Error("Unauthorized")
    }
}

export type ServiceDayState = {
    success?: boolean
    error?: string
    validationErrors?: Record<string, string[] | undefined>
}

export async function createServiceDay(prevState: ServiceDayState, formData: FormData): Promise<ServiceDayState> {
    try {
        await checkAuth()

        const rawData = {
            name: formData.get("name"),
            weekDay: Number(formData.get("weekDay")),
            minSoundOperators: Number(formData.get("minSoundOperators")),
            maxSoundOperators: Number(formData.get("maxSoundOperators")),
        }

        const validatedData = serviceDaySchema.safeParse(rawData)

        if (!validatedData.success) {
            return {
                success: false,
                validationErrors: validatedData.error.flatten().fieldErrors,
                error: "Validation failed"
            }
        }

        await prisma.serviceDay.create({
            data: validatedData.data,
        })

        revalidatePath("/service-days")
        return { success: true }

    } catch (error: any) {
        console.error("Create service day error:", error)
        return { success: false, error: error.message || "Failed to create service day" }
    }
}

export async function updateServiceDay(id: string, prevState: ServiceDayState, formData: FormData): Promise<ServiceDayState> {
    try {
        await checkAuth()

        const rawData = {
            name: formData.get("name"),
            weekDay: Number(formData.get("weekDay")),
            minSoundOperators: Number(formData.get("minSoundOperators")),
            maxSoundOperators: Number(formData.get("maxSoundOperators")),
        }

        const validatedData = serviceDaySchema.safeParse(rawData)

        if (!validatedData.success) {
            return {
                success: false,
                validationErrors: validatedData.error.flatten().fieldErrors,
                error: "Validation failed"
            }
        }

        await prisma.serviceDay.update({
            where: { id },
            data: validatedData.data,
        })

        revalidatePath("/service-days")
        return { success: true }

    } catch (error: any) {
        console.error("Update service day error:", error)
        return { success: false, error: error.message || "Failed to update service day" }
    }
}

export async function deleteServiceDay(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await checkAuth()
        await prisma.serviceDay.delete({
            where: { id },
        })
        revalidatePath("/service-days")
        return { success: true }
    } catch (error) {
        console.error("Delete service day error:", error)
        return { success: false, error: "Failed to delete service day" }
    }
}
