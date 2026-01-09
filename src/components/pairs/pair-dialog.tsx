"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

type SoundOperator = {
  id: string
  name: string
}

type PairDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PairDialog({
  open,
  onOpenChange,
  onSuccess,
}: PairDialogProps) {
  const t = useTranslations("pairs")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [operators, setOperators] = useState<SoundOperator[]>([])

  const [formData, setFormData] = useState({
    firstOperatorId: "",
    secondOperatorId: "",
  })

  useEffect(() => {
    if (open) {
      fetchOperators()
      setFormData({ firstOperatorId: "", secondOperatorId: "" })
    }
  }, [open])

  const fetchOperators = async () => {
    try {
      const response = await fetch("/api/operators")
      const data = await response.json()
      setOperators(data)
    } catch (error) {
      console.error("Failed to fetch operators:", error)
    }
  }

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
      const response = await fetch("/api/pairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: tc("save"),
          description: t("success"),
        })
        onSuccess()
      } else {
        const error = await response.json()
        let errorMessage = t("error")
        
        if (error.error === "Operators must be different") {
          errorMessage = t("sameOperatorError")
        } else if (error.error === "Pair already exists") {
          errorMessage = t("duplicateError")
        } else if (error.error.includes("availability")) {
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
