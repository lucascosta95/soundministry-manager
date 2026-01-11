"use client"

import {useTranslations} from "next-intl"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {useState} from "react"
import {Loader2} from "lucide-react"

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  userId: string
}

export function ResetPasswordDialog({ open, onOpenChange, onSuccess, userId }: ResetPasswordDialogProps) {
  const t = useTranslations("users")
  const tc = useTranslations("common")
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: "POST",
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
      } else {
        const data = await response.json()
        alert(data.error || t("resetPasswordError"))
      }
    } catch (error) {
      alert(t("resetPasswordError"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("resetPassword")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("resetPasswordConfirm")}
            <br />
            {t("resetPasswordDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tc("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
