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

type PreferredPair = {
  id: string
  firstOperator: {
    name: string
  }
  secondOperator: {
    name: string
  }
}

type DeletePairDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pair: PreferredPair | null
  onSuccess: () => void
}

export function DeletePairDialog({
  open,
  onOpenChange,
  pair,
  onSuccess,
}: DeletePairDialogProps) {
  const t = useTranslations("pairs")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!pair) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/pairs/${pair.id}`, {
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

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
          <AlertDialogDescription>
            {pair && (
              <span className="font-semibold block mt-2">
                {pair.firstOperator.name} & {pair.secondOperator.name}
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
