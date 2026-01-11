"use client"

import {useEffect, useState} from "react"
import {useTranslations} from "next-intl"
import {Pencil, Plus, Trash2} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader} from "@/components/ui/card"
import {Skeleton} from "@/components/ui/skeleton"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {ServiceDayDialog} from "@/components/service-days/service-day-dialog"
import {DeleteServiceDayDialog} from "@/components/service-days/delete-service-day-dialog"
import {ServiceDay} from "@prisma/client"

export default function ServiceDaysPage() {
  const [serviceDays, setServiceDays] = useState<ServiceDay[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations("serviceDays")
  const tc = useTranslations("common")

  const fetchServiceDays = async () => {
    try {
      const response = await fetch("/api/service-days")
      if (response.ok) {
        const data = await response.json()
        setServiceDays(data)
      }
    } catch (error) {
      console.error("Failed to fetch service days:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServiceDays()
  }, [])

  const getWeekDayLabel = (day: number) => {
    const days = [
      "sunday", "monday", "tuesday", "wednesday", 
      "thursday", "friday", "saturday"
    ]
    return t(days[day] as any)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("subtitle")}
          </p>
        </div>
        <ServiceDayDialog onSuccess={fetchServiceDays}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("newServiceDay")}
          </Button>
        </ServiceDayDialog>
      </div>

      <Card>
        <CardHeader></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array(10).fill(null).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : serviceDays.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("noServiceDays")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("weekDay")}</TableHead>
                  <TableHead className="text-center">{t("minOperators")}</TableHead>
                  <TableHead className="text-center">{t("maxOperators")}</TableHead>
                  <TableHead className="text-right">{tc("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceDays.map((serviceDay) => (
                  <TableRow key={serviceDay.id}>
                    <TableCell className="font-medium">
                      {serviceDay.name}
                    </TableCell>
                    <TableCell>
                      {getWeekDayLabel(serviceDay.weekDay)}
                    </TableCell>
                    <TableCell className="text-center">
                      {serviceDay.minSoundOperators}
                    </TableCell>
                    <TableCell className="text-center">
                      {serviceDay.maxSoundOperators}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <ServiceDayDialog 
                          serviceDay={serviceDay} 
                          onSuccess={fetchServiceDays}
                        >
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </ServiceDayDialog>
                        
                        <DeleteServiceDayDialog 
                          id={serviceDay.id} 
                          onSuccess={fetchServiceDays}
                        >
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DeleteServiceDayDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
