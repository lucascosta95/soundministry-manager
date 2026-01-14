"use client"

import {useEffect, useState} from "react"
import {useTranslations} from "next-intl"
import {Button} from "@/components/ui/button"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"
import {useToast} from "@/components/ui/use-toast"
import {ServiceDay} from "@prisma/client"
import {createServiceDay, updateServiceDay} from "@/actions/service-days"

interface ServiceDayDialogProps {
  children: React.ReactNode
  serviceDay?: ServiceDay
  onSuccess: () => void
}

export function ServiceDayDialog({ children, serviceDay, onSuccess }: ServiceDayDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [weekDay, setWeekDay] = useState("0")
  const [minSoundOperators, setMinSoundOperators] = useState("1")
  const [maxSoundOperators, setMaxSoundOperators] = useState("2")
  
  const t = useTranslations("serviceDays")
  const tc = useTranslations("common")
  const tm = useTranslations("serviceDays") // Usando serviceDays para dias da semana
  const { toast } = useToast()

  useEffect(() => {
    if (serviceDay) {
      setName(serviceDay.name)
      setWeekDay(serviceDay.weekDay.toString())
      setMinSoundOperators(serviceDay.minSoundOperators.toString())
      setMaxSoundOperators(serviceDay.maxSoundOperators.toString())
    } else {
      setName("")
      setWeekDay("0")
      setMinSoundOperators("1")
      setMaxSoundOperators("2")
    }
  }, [serviceDay, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
        const formData = new FormData()
        formData.append("name", name)
        formData.append("weekDay", weekDay)
        formData.append("minSoundOperators", minSoundOperators)
        formData.append("maxSoundOperators", maxSoundOperators)

        const result = serviceDay
            ? await updateServiceDay(serviceDay.id, {}, formData)
            : await createServiceDay({}, formData)

      if (!result.success) throw new Error(result.error)

      toast({
        title: t("success"),
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

  const weekDays = [
    { value: "0", label: tm("sunday") },
    { value: "1", label: tm("monday") },
    { value: "2", label: tm("tuesday") },
    { value: "3", label: tm("wednesday") },
    { value: "4", label: tm("thursday") },
    { value: "5", label: tm("friday") },
    { value: "6", label: tm("saturday") },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {serviceDay ? t("editServiceDay") : t("newServiceDay")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="weekDay">{t("weekDay")}</Label>
            <Select value={weekDay} onValueChange={setWeekDay}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weekDays.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minOperators">{t("minOperators")}</Label>
              <Input
                id="minOperators"
                type="number"
                min="1"
                value={minSoundOperators}
                onChange={(e) => setMinSoundOperators(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxOperators">{t("maxOperators")}</Label>
              <Input
                id="maxOperators"
                type="number"
                min={minSoundOperators}
                value={maxSoundOperators}
                onChange={(e) => setMaxSoundOperators(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? tc("loading") : tc("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
