"use client"

import {useState} from "react"
import {useTranslations} from "next-intl"
import {Button} from "@/components/ui/button"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,} from "@/components/ui/dialog"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"
import {Label} from "@/components/ui/label"
import {useToast} from "@/components/ui/use-toast"
import {generateScheduleAction} from "@/actions/schedules"

interface GenerateScheduleDialogProps {
  children: React.ReactNode
  onSuccess: () => void
}

export function GenerateScheduleDialog({ children, onSuccess }: GenerateScheduleDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [month, setMonth] = useState<string>("")
  const [year, setYear] = useState<string>(new Date().getFullYear().toString())
  
  const t = useTranslations("schedules")
  const tm = useTranslations("months")
  const tc = useTranslations("common")
  const { toast } = useToast()

  const months = [
    { value: "1", label: tm("january") },
    { value: "2", label: tm("february") },
    { value: "3", label: tm("march") },
    { value: "4", label: tm("april") },
    { value: "5", label: tm("may") },
    { value: "6", label: tm("june") },
    { value: "7", label: tm("july") },
    { value: "8", label: tm("august") },
    { value: "9", label: tm("september") },
    { value: "10", label: tm("october") },
    { value: "11", label: tm("november") },
    { value: "12", label: tm("december") },
  ]

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() + i).toString())

  const handleGenerate = async () => {
    if (!month || !year) return

    setLoading(true)
    try {
        const formData = new FormData()
        formData.append("month", month)
        formData.append("year", year)

        const result = await generateScheduleAction({}, formData)

      if (!result.success) {
        throw new Error(result.error || t("error"))
      }

      toast({
        title: t("success"),
        className: "bg-green-500 text-white border-none",
      })
      setOpen(false)
      onSuccess()
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("newSchedule")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("month")}</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder={t("month")} />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("year")}</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder={t("year")} />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            className="w-full" 
            onClick={handleGenerate}
            disabled={loading || !month || !year}
          >
            {loading ? tc("loading") : t("generate")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
