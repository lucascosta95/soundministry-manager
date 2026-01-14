"use client"

import {useEffect, useState} from "react"
import {useTranslations} from "next-intl"
import {Dialog, DialogContent, DialogHeader, DialogTitle,} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"
import {useToast} from "@/components/ui/use-toast"
import {createPair} from "@/actions/pairs"

type SoundOperator = {
  id: string
  name: string
}

type PairDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  operators: SoundOperator[]
}

export function PairDialog({
  open,
  onOpenChange,
  onSuccess,
  operators,
}: PairDialogProps) {
  const t = useTranslations("pairs")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    firstOperatorId: "",
    secondOperatorId: "",
  })

  useEffect(() => {
    if (open) {
      setFormData({ firstOperatorId: "", secondOperatorId: "" })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.firstOperatorId === formData.secondOperatorId) {
      toast({
        title: "Erro",
        description: t("sameOperatorError"),
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
        const formDataObj = new FormData()
        formDataObj.append("firstOperatorId", formData.firstOperatorId)
        formDataObj.append("secondOperatorId", formData.secondOperatorId)

        const result = await createPair({}, formDataObj)

      if (result.success) {
        toast({
          title: tc("save"),
          description: t("success"),
        })
        onSuccess()
      } else {
        let errorMessage = t("error")
        
        if (result.error === "Operators must be different") {
          errorMessage = t("sameOperatorError")
        } else if (result.error === "Pair already exists") {
          errorMessage = t("duplicateError")
        } else if (result.error?.includes("availability")) {
          errorMessage = t("incompatibilityError")
        }

        toast({
          title: "Erro",
          description: errorMessage,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("newPair")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="first">{t("firstOperator")}</Label>
            <Select
              value={formData.firstOperatorId}
              onValueChange={(value) =>
                setFormData({ ...formData, firstOperatorId: value })
              }
            >
              <SelectTrigger id="first">
                <SelectValue placeholder={t("selectOperator")} />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="second">{t("secondOperator")}</Label>
            <Select
              value={formData.secondOperatorId}
              onValueChange={(value) =>
                setFormData({ ...formData, secondOperatorId: value })
              }
            >
              <SelectTrigger id="second">
                <SelectValue placeholder={t("selectOperator")} />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !formData.firstOperatorId ||
                !formData.secondOperatorId
              }
            >
              {isLoading ? tc("loading") : tc("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
