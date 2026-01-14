"use client"

import {useEffect, useState} from "react"
import {useTranslations} from "next-intl"
import {Dialog, DialogContent, DialogHeader, DialogTitle,} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Checkbox} from "@/components/ui/checkbox"
import {useToast} from "@/components/ui/use-toast"
import {createOperator, updateOperator} from "@/actions/operators"

export type SoundOperator = {
  id: string
  name: string
  birthday: string
  monthlyAvailability: number
  weeklyAvailability: string[]
  annualAvailability: string[]
  canWorkAlone: boolean
}

type OperatorDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  operator: SoundOperator | null
  onSuccess: () => void
  serviceDays: { id: string; name: string; weekDay: number }[]
}

const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
]

export function OperatorDialog({
  open,
  onOpenChange,
  operator,
  onSuccess,
  serviceDays,
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
    canWorkAlone: false,
  })

  useEffect(() => {
    if (operator) {
      setFormData({
        name: operator.name,
        birthday: operator.birthday.split("T")[0],
        monthlyAvailability: operator.monthlyAvailability,
        weeklyAvailability: operator.weeklyAvailability,
        annualAvailability: operator.annualAvailability,
        canWorkAlone: operator.canWorkAlone,
      })
    } else {
      setFormData({
        name: "",
        birthday: "",
        monthlyAvailability: 4,
        weeklyAvailability: [],
        annualAvailability: [],
        canWorkAlone: false,
      })
    }
  }, [operator, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
        const formDataObj = new FormData()
        formDataObj.append("name", formData.name)
        formDataObj.append("birthday", formData.birthday)
        formDataObj.append("monthlyAvailability", formData.monthlyAvailability.toString())
        formDataObj.append("weeklyAvailability", JSON.stringify(formData.weeklyAvailability))
        formDataObj.append("annualAvailability", JSON.stringify(formData.annualAvailability))
        if (formData.canWorkAlone) {
            formDataObj.append("canWorkAlone", "on")
        }

        const result = operator
            ? await updateOperator(operator.id, {}, formDataObj)
            : await createOperator({}, formDataObj)

      if (result.success) {
        toast({
          title: tc("save"),
          description: t("success"),
        })
        onSuccess()
      } else {
        toast({
          title: "Erro",
          description: result.error || t("error"),
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

  const toggleDay = (dayId: string) => {
    setFormData((prev) => ({
      ...prev,
      weeklyAvailability: prev.weeklyAvailability.includes(dayId)
        ? prev.weeklyAvailability.filter((d) => d !== dayId)
        : [...prev.weeklyAvailability, dayId],
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

  const getDayLabel = (day: number) => {
    const days = [
      t("sunday"),
      t("monday"),
      t("tuesday"),
      t("wednesday"),
      t("thursday"),
      t("friday"),
      t("saturday"),
    ]
    return days[day] || ""
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="canWorkAlone"
              checked={formData.canWorkAlone}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, canWorkAlone: checked === true })
              }
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="canWorkAlone"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("canWorkAlone")}
              </label>
              <p className="text-sm text-muted-foreground">
                {t("canWorkAloneDesc")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t("weeklyAvailability")}</Label>
            <div className="space-y-2">
              {serviceDays.map((day) => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={day.id}
                    checked={formData.weeklyAvailability.includes(day.id)}
                    onCheckedChange={() => toggleDay(day.id)}
                  />
                  <label
                    htmlFor={day.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {day.name} <span className="text-muted-foreground text-xs">({getDayLabel(day.weekDay)})</span>
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
