"use client"

import {useState} from "react"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {useToast} from "@/components/ui/use-toast"

interface DeleteServiceDayDialogProps {
  children: React.ReactNode
  id: string
  onSuccess: () => void
}

export function DeleteServiceDayDialog({ children, id, onSuccess }: DeleteServiceDayDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const t = useTranslations("serviceDays")
  const tc = useTranslations("common")
  const { toast } = useToast()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/service-days/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error()

      toast({
        title: t("deleteSuccess"),
        className: "bg-green-500 text-white border-none",
      })
      setOpen(false)
      onSuccess()
    } catch (error) {
      toast({
        title: t("error"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? tc("loading") : tc("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
