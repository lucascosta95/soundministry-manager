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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"

type SoundOperator = {
  id: string
  name: string
  birthday: string
  monthlyAvailability: number
  weeklyAvailability: string[]
  annualAvailability: string[]
}

type OperatorDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  operator: SoundOperator | null
  onSuccess: () => void
}

const DAYS = ["WEDNESDAY", "SATURDAY", "SUNDAY"]
const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
]

export function OperatorDialog({
  open,
  onOpenChange,
  operator,
  onSuccess,
}: OperatorDialogProps) {
  const t = useTranslations("operators")
  const tm = useTranslations("months")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    birthday: "",
    monthlyAvailability: 4,
    weeklyAvailability: [] as string[],
    annualAvailability: [] as string[],
  })

  useEffect(() => {
    if (operator) {
      setFormData({
        name: operator.name,
        birthday: operator.birthday.split("T")[0],
        monthlyAvailability: operator.monthlyAvailability,
        weeklyAvailability: operator.weeklyAvailability,
        annualAvailability: operator.annualAvailability,
      })
    } else {
      setFormData({
        name: "",
        birthday: "",
        monthlyAvailability: 4,
        weeklyAvailability: [],
        annualAvailability: [],
      })
    }
  }, [operator, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = operator
        ? `/api/operators/${operator.id}`
        : "/api/operators"
      const method = operator ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
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
        toast({
          title: "Erro",
          description: error.error || t("error"),
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

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      weeklyAvailability: prev.weeklyAvailability.includes(day)
        ? prev.weeklyAvailability.filter((d) => d !== day)
        : [...prev.weeklyAvailability, day],
    }))
  }

  const toggleMonth = (month: string) => {
    setFormData((prev) => ({
      ...prev,
      annualAvailability: prev.annualAvailability.includes(month)
        ? prev.annualAvailability.filter((m) => m !== month)
        : [...prev.annualAvailability, month],
    }))
  }

  const getDayLabel = (day: string) => {
    const days: Record<string, string> = {
      WEDNESDAY: t("wednesday"),
      SATURDAY: t("saturday"),
      SUNDAY: t("sunday"),
    }
    return days[day] || day
  }

  const getMonthLabel = (month: string) => {
    return tm(month.toLowerCase() as any)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {operator ? t("editOperator") : t("newOperator")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthday">{t("birthday")}</Label>
            <Input
              id="birthday"
              type="date"
              value={formData.birthday}
              onChange={(e) =>
                setFormData({ ...formData, birthday: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly">{t("monthlyAvailability")}</Label>
            <Input
              id="monthly"
              type="number"
              min="1"
              value={formData.monthlyAvailability}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthlyAvailability: parseInt(e.target.value),
                })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              {t("monthlyAvailabilityDesc")}
            </p>
          </div>

          <div className="space-y-3">
            <Label>{t("weeklyAvailability")}</Label>
            <div className="space-y-2">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={formData.weeklyAvailability.includes(day)}
                    onCheckedChange={() => toggleDay(day)}
                  />
                  <label
                    htmlFor={day}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {getDayLabel(day)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t("annualAvailability")}</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {MONTHS.map((month) => (
                <div key={month} className="flex items-center space-x-2">
                  <Checkbox
                    id={month}
                    checked={formData.annualAvailability.includes(month)}
                    onCheckedChange={() => toggleMonth(month)}
                  />
                  <label
                    htmlFor={month}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {getMonthLabel(month)}
                  </label>
                </div>
              ))}
            </div>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? tc("loading") : tc("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
