"use client"

import {useEffect, useState} from "react"
import {useTranslations} from "next-intl"
import {Dialog, DialogContent, DialogHeader, DialogTitle,} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"
import {Input} from "@/components/ui/input"
import {useToast} from "@/components/ui/use-toast"
import {createRestriction, updateRestriction} from "@/actions/restrictions"

type SoundOperator = {
  id: string
  name: string
}

export type MonthlyRestriction = {
  id: string
  operatorId: string
  month: number
  year: number
  restrictedDays: number[]
  operator?: {
    name: string
  }
}

type RestrictionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  restriction: MonthlyRestriction | null
  onSuccess: () => void
  operators: SoundOperator[]
}

export function RestrictionDialog({
  open,
  onOpenChange,
  restriction,
  onSuccess,
  operators,
}: RestrictionDialogProps) {
  const t = useTranslations("restrictions")
  const tm = useTranslations("months")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const currentYear = new Date().getFullYear()

  const [formData, setFormData] = useState({
    operatorId: "",
    month: 1,
    year: currentYear,
    restrictedDays: [] as number[],
  })

  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (open) {
      if (restriction) {
        setFormData({
          operatorId: restriction.operatorId,
          month: restriction.month,
          year: restriction.year,
          restrictedDays: restriction.restrictedDays,
        })
        setSelectedDays(new Set(restriction.restrictedDays))
      } else {
        setFormData({
          operatorId: "",
          month: new Date().getMonth() + 1,
          year: currentYear,
          restrictedDays: [],
        })
        setSelectedDays(new Set())
      }
    }
  }, [open, restriction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const submitData = {
      ...formData,
      restrictedDays: Array.from(selectedDays).sort((a, b) => a - b),
    }

    try {
        const formDataObj = new FormData()
        formDataObj.append("operatorId", submitData.operatorId)
        formDataObj.append("month", submitData.month.toString())
        formDataObj.append("year", submitData.year.toString())
        formDataObj.append("restrictedDays", JSON.stringify(submitData.restrictedDays))

        const result = restriction
            ? await updateRestriction(restriction.id, {}, formDataObj)
            : await createRestriction({}, formDataObj)

      if (result.success) {
        toast({
          title: tc("save"),
          description: t("success"),
        })
        onSuccess()
      } else {
        let errorMessage = t("error")
        
        if (result.error?.includes("already exists")) {
          errorMessage = t("duplicateError")
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

  const toggleDay = (day: number) => {
    const newSet = new Set(selectedDays)
    if (newSet.has(day)) {
      newSet.delete(day)
    } else {
      newSet.add(day)
    }
    setSelectedDays(newSet)
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay()
  }

  const buildCalendarGrid = (month: number, year: number) => {
    const daysInMonth = getDaysInMonth(month, year)
    const firstDayOfWeek = getFirstDayOfMonth(month, year)
    
    const calendar = []
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendar.push(null)
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push(day)
    }
    
    return calendar
  }

  const calendarGrid = buildCalendarGrid(formData.month, formData.year)
  const weekDayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  const getMonthName = (month: number) => {
    const months = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ]
    return tm(months[month - 1] as any)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {restriction ? t("editRestriction") : t("newRestriction")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="operator">{t("operator")}</Label>
            <Select
              value={formData.operatorId}
              onValueChange={(value) =>
                setFormData({ ...formData, operatorId: value })
              }
              disabled={!!restriction}
            >
              <SelectTrigger id="operator">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">{t("month")}</Label>
              <Select
                value={formData.month.toString()}
                onValueChange={(value) => {
                  setFormData({ ...formData, month: parseInt(value) })
                  setSelectedDays(new Set()) // Reset days when month changes
                }}
                disabled={!!restriction}
              >
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">{t("year")}</Label>
              <Input
                id="year"
                type="number"
                min={currentYear}
                max={currentYear + 5}
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: parseInt(e.target.value) })
                }
                disabled={!!restriction}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t("restrictedDays")}</Label>
            
            {/* Cabeçalho com dias da semana */}
            <div className="grid grid-cols-7 gap-2">
              {weekDayNames.map((dayName, index) => (
                <div
                  key={`header-${index}`}
                  className="text-center text-xs font-semibold text-muted-foreground py-2"
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Grid do calendário */}
            <div className="grid grid-cols-7 gap-2">
              {calendarGrid.map((day, index) => (
                day === null ? (
                  <div key={`empty-${index}`} className="h-12 w-full" />
                ) : (
                  <Button
                    key={`day-${day}`}
                    type="button"
                    variant={selectedDays.has(day) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(day)}
                    className="h-12 w-full flex items-center justify-center p-1"
                  >
                    <span className="text-sm font-semibold">{day}</span>
                  </Button>
                )
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              {t("selectDays")} ({selectedDays.size} selecionado{selectedDays.size !== 1 ? "s" : ""})
            </p>
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
              disabled={isLoading || !formData.operatorId || selectedDays.size === 0}
            >
              {isLoading ? tc("loading") : tc("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
