"use server"

import {prisma} from "@/lib/prisma"
import {z} from "zod"
import {revalidatePath} from "next/cache"
import {getIronSession} from "iron-session"
import {cookies} from "next/headers"
import {SessionData, sessionOptions} from "@/lib/session"

const pairSchema = z.object({
  firstOperatorId: z.string().min(1),
  secondOperatorId: z.string().min(1),
})

async function checkAuth() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn) {
        throw new Error("Unauthorized")
    }
}

export type PairState = {
    success?: boolean
    error?: string
    validationErrors?: Record<string, string[] | undefined>
}

export async function createPair(prevState: PairState, formData: FormData): Promise<PairState> {
    try {
        await checkAuth()

        const rawData = {
            firstOperatorId: formData.get("firstOperatorId"),
            secondOperatorId: formData.get("secondOperatorId"),
        }

        const validatedData = pairSchema.safeParse(rawData)

        if (!validatedData.success) {
            return {
                success: false,
                validationErrors: validatedData.error.flatten().fieldErrors,
                error: "Validation failed"
            }
        }

        const { firstOperatorId, secondOperatorId } = validatedData.data

        if (firstOperatorId === secondOperatorId) {
            return { success: false, error: "Operators must be different" }
        }

        const existingPair = await prisma.preferredPair.findFirst({
            where: {
                OR: [
                    { firstOperatorId, secondOperatorId },
                    { firstOperatorId: secondOperatorId, secondOperatorId: firstOperatorId },
                ],
            },
        })

        if (existingPair) {
            return { success: false, error: "Pair already exists" }
        }

        await prisma.preferredPair.create({
            data: {
                firstOperatorId,
                secondOperatorId,
            },
        })

        revalidatePath("/pairs")
        return { success: true }
    } catch (error) {
        console.error("Create pair error:", error)
        return { success: false, error: "Failed to create pair" }
    }
}

export async function deletePair(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await checkAuth()
        await prisma.preferredPair.delete({
            where: { id },
        })
        revalidatePath("/pairs")
        return { success: true }
    } catch (error) {
        console.error("Delete pair error:", error)
        return { success: false, error: "Failed to delete pair" }
    }
}
