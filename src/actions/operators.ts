"use server"

import {prisma} from "@/lib/prisma"
import {z} from "zod"
import {revalidatePath} from "next/cache"
import {getIronSession} from "iron-session"
import {cookies} from "next/headers"
import {SessionData, sessionOptions} from "@/lib/session"

const operatorSchema = z.object({
  name: z.string().min(1),
  birthday: z.string(),
  monthlyAvailability: z.number().min(1),
  weeklyAvailability: z.array(z.string()),
  annualAvailability: z.array(z.string()),
  canWorkAlone: z.boolean().default(false),
})

async function checkAuth() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn) {
        throw new Error("Unauthorized")
    }
}

export type OperatorState = {
    success?: boolean
    error?: string
    validationErrors?: Record<string, string[] | undefined>
}

export async function createOperator(prevState: OperatorState, formData: FormData): Promise<OperatorState> {
    try {
        await checkAuth()

        const rawData = {
            name: formData.get("name"),
            birthday: formData.get("birthday"),
            monthlyAvailability: Number(formData.get("monthlyAvailability")),
            weeklyAvailability: JSON.parse(formData.get("weeklyAvailability") as string || "[]"),
            annualAvailability: JSON.parse(formData.get("annualAvailability") as string || "[]"),
            canWorkAlone: formData.get("canWorkAlone") === "on",
        }

        const validatedData = operatorSchema.safeParse(rawData)

        if (!validatedData.success) {
            return {
                success: false,
                validationErrors: validatedData.error.flatten().fieldErrors,
                error: "Validation failed"
            }
        }

        await prisma.soundOperator.create({
            data: {
                ...validatedData.data,
                birthday: new Date(validatedData.data.birthday),
            },
        })

        revalidatePath("/operators")
        return { success: true }
    } catch (error) {
        console.error("Create operator error:", error)
        return { success: false, error: "Failed to create operator" }
    }
}

export async function updateOperator(id: string, prevState: OperatorState, formData: FormData): Promise<OperatorState> {
    try {
        await checkAuth()

        const rawData = {
            name: formData.get("name"),
            birthday: formData.get("birthday"),
            monthlyAvailability: Number(formData.get("monthlyAvailability")),
            weeklyAvailability: JSON.parse(formData.get("weeklyAvailability") as string || "[]"),
            annualAvailability: JSON.parse(formData.get("annualAvailability") as string || "[]"),
            canWorkAlone: formData.get("canWorkAlone") === "on",
        }

        const validatedData = operatorSchema.safeParse(rawData)

        if (!validatedData.success) {
            return {
                success: false,
                validationErrors: validatedData.error.flatten().fieldErrors,
                error: "Validation failed"
            }
        }

        await prisma.soundOperator.update({
            where: { id },
            data: {
                ...validatedData.data,
                birthday: new Date(validatedData.data.birthday),
            },
        })

        revalidatePath("/operators")
        return { success: true }
    } catch (error) {
        console.error("Update operator error:", error)
        return { success: false, error: "Failed to update operator" }
    }
}

export async function deleteOperator(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await checkAuth()
        await prisma.soundOperator.delete({
            where: { id },
        })
        revalidatePath("/operators")
        return { success: true }
    } catch (error) {
        console.error("Delete operator error:", error)
        return { success: false, error: "Failed to delete operator" }
    }
}
