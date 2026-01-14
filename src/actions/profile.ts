"use server"

import {prisma} from "@/lib/prisma"
import {z} from "zod"
import {getIronSession} from "iron-session"
import {cookies} from "next/headers"
import {SessionData, sessionOptions} from "@/lib/session"
import bcrypt from "bcryptjs"
import {revalidatePath} from "next/cache"

const updateProfileSchema = z.object({
  name: z.string().min(1),
  preferredTheme: z.string().optional(),
  preferredLocale: z.string().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
})

async function checkAuth() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn || !session.userId) {
        throw new Error("Unauthorized")
    }
    return session
}

export type ProfileState = {
    success?: boolean
    error?: string
    validationErrors?: Record<string, string[] | undefined>
}

export async function updateProfile(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
    try {
        const session = await checkAuth()

        const rawData = {
            name: formData.get("name"),
            preferredTheme: formData.get("preferredTheme"),
            preferredLocale: formData.get("preferredLocale"),
        }

        const validatedData = updateProfileSchema.safeParse(rawData)

        if (!validatedData.success) {
            return {
                success: false,
                validationErrors: validatedData.error.flatten().fieldErrors,
                error: "Validation failed"
            }
        }

        await prisma.user.update({
            where: { id: session.userId },
            data: validatedData.data,
        })

        revalidatePath("/profile")
        return { success: true }

    } catch (error: any) {
        console.error("Update profile error:", error)
        return { success: false, error: error.message || "Failed to update profile" }
    }
}

export async function changePassword(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
    try {
        const session = await checkAuth()

        const rawData = {
            currentPassword: formData.get("currentPassword"),
            newPassword: formData.get("newPassword"),
        }

        const validatedData = changePasswordSchema.safeParse(rawData)

        if (!validatedData.success) {
            return {
                success: false,
                validationErrors: validatedData.error.flatten().fieldErrors,
                error: "Validation failed"
            }
        }

        const { currentPassword, newPassword } = validatedData.data

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
        })

        if (!user) {
            return { success: false, error: "User not found" }
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

        if (!isPasswordValid) {
            return { success: false, error: "Current password is incorrect" }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await prisma.user.update({
            where: { id: session.userId },
            data: { password: hashedPassword },
        })

        return { success: true }

    } catch (error: any) {
        console.error("Change password error:", error)
        return { success: false, error: error.message || "Failed to change password" }
    }
}
