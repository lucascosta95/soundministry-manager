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
} from "@/components/ui/alert-dialog"
import {useToast} from "@/components/ui/use-toast"

export type MonthlyRestriction = {
  id: string
  month: number
  year: number
  operator?: {
    name: string
  }
}

type DeleteRestrictionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  restriction: MonthlyRestriction | null
  onSuccess: () => void
}

export function DeleteRestrictionDialog({
  open,
  onOpenChange,
  restriction,
  onSuccess,
}: DeleteRestrictionDialogProps) {
  const t = useTranslations("restrictions")
  const tm = useTranslations("months")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!restriction) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/restrictions/${restriction.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: tc("delete"),
          description: t("deleteSuccess"),
        })
        onSuccess()
      } else {
        toast({
          title: "Erro",
          description: t("error"),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: t("error"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getMonthName = (month: number) => {
    const months = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ]
    return tm(months[month - 1] as any)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
          <AlertDialogDescription>
            {restriction && (
              <span className="font-semibold block mt-2">
                {restriction.operator?.name || "Desconhecido"} - {getMonthName(restriction.month)}/{restriction.year}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {tc("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? tc("loading") : tc("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
