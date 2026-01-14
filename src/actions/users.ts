"use server"

import {prisma} from "@/lib/prisma"
import {z} from "zod"
import {revalidatePath} from "next/cache"
import {getIronSession} from "iron-session"
import {cookies} from "next/headers"
import {SessionData, sessionOptions} from "@/lib/session"
import bcrypt from "bcryptjs"

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["USER", "ADMIN"]),
  password: z.string().optional(),
})

async function checkAuth(requireAdmin = false) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn || !session.userId) {
        throw new Error("Unauthorized")
    }

    if (requireAdmin) {
        const user = await prisma.user.findUnique({ where: { id: session.userId } })
        if (user?.role !== "ADMIN") {
            throw new Error("Forbidden")
        }
    }

    return session
}

export type UserState = {
    success?: boolean
    error?: string
    validationErrors?: Record<string, string[] | undefined>
}

export async function createUser(prevState: UserState, formData: FormData): Promise<UserState> {
    try {
        await checkAuth(true)

        const rawData = {
            name: formData.get("name"),
            email: formData.get("email"),
            role: formData.get("role"),
            password: formData.get("password") || undefined,
        }

        const validatedData = userSchema.safeParse(rawData)

        if (!validatedData.success) {
            return {
                success: false,
                validationErrors: validatedData.error.flatten().fieldErrors,
                error: "Validation failed"
            }
        }

        const { name, email, role, password } = validatedData.data

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return { success: false, error: "Email already in use" }
        }

        const hashedPassword = await bcrypt.hash(password || "sound123", 10)

        await prisma.user.create({
            data: {
                name,
                email,
                role,
                password: hashedPassword,
                preferredTheme: "system",
                preferredLocale: "pt-BR",
            },
        })

        revalidatePath("/users")
        return { success: true }

    } catch (error: any) {
        console.error("Create user error:", error)
        return { success: false, error: error.message || "Failed to create user" }
    }
}

export async function updateUser(id: string, prevState: UserState, formData: FormData): Promise<UserState> {
    try {
        await checkAuth(true)

        const rawData = {
            name: formData.get("name"),
            email: formData.get("email"),
            role: formData.get("role"),
        }

        const validatedData = userSchema.omit({ password: true }).safeParse(rawData)

        if (!validatedData.success) {
            return {
                success: false,
                validationErrors: validatedData.error.flatten().fieldErrors,
                error: "Validation failed"
            }
        }

        const { name, email, role } = validatedData.data

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing && existing.id !== id) {
            return { success: false, error: "Email already in use" }
        }

        await prisma.user.update({
            where: { id },
            data: { name, email, role },
        })

        revalidatePath("/users")
        return { success: true }

    } catch (error: any) {
        console.error("Update user error:", error)
        return { success: false, error: error.message || "Failed to update user" }
    }
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await checkAuth(true)
        
        if (session.userId === id) {
            return { success: false, error: "Cannot delete yourself" }
        }

        await prisma.user.delete({ where: { id } })
        revalidatePath("/users")
        return { success: true }
    } catch (error: any) {
        console.error("Delete user error:", error)
        return { success: false, error: error.message || "Failed to delete user" }
    }
}

export async function resetPassword(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await checkAuth(true)
        const hashedPassword = await bcrypt.hash("sound123", 10)
        
        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        })
        
        return { success: true }
    } catch (error: any) {
        console.error("Reset password error:", error)
        return { success: false, error: error.message || "Failed to reset password" }
    }
}
