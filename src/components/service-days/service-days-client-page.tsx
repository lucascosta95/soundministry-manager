"use client"

import {useTranslations} from "next-intl"
import {Pencil, Plus, Trash2} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader} from "@/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {ServiceDayDialog} from "@/components/service-days/service-day-dialog"
import {DeleteServiceDayDialog} from "@/components/service-days/delete-service-day-dialog"
import {ServiceDay} from "@prisma/client"
import {useRouter} from "next/navigation"

interface ServiceDaysClientPageProps {
    serviceDays: ServiceDay[]
}

export default function ServiceDaysClientPage({ serviceDays }: ServiceDaysClientPageProps) {
  const t = useTranslations("serviceDays")
  const tc = useTranslations("common")
  const router = useRouter()

  const handleRefresh = () => {
      router.refresh()
  }

  const getWeekDayLabel = (day: number) => {
    const days = [
      "sunday", "monday", "tuesday", "wednesday", 
      "thursday", "friday", "saturday"
    ]
    return t(days[day] as any)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("subtitle")}
          </p>
        </div>
        <ServiceDayDialog onSuccess={handleRefresh}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("newServiceDay")}
          </Button>
        </ServiceDayDialog>
      </div>

      <Card>
        <CardHeader></CardHeader>
        <CardContent>
          {serviceDays.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("noServiceDays")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("weekDay")}</TableHead>
                  <TableHead className="text-center hidden md:table-cell">{t("minOperators")}</TableHead>
                  <TableHead className="text-center hidden md:table-cell">{t("maxOperators")}</TableHead>
                  <TableHead className="text-right">{tc("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceDays.map((serviceDay) => (
                  <TableRow key={serviceDay.id}>
                    <TableCell className="font-medium">
                      {serviceDay.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getWeekDayLabel(serviceDay.weekDay)}
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      {serviceDay.minSoundOperators}
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      {serviceDay.maxSoundOperators}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <ServiceDayDialog 
                          serviceDay={serviceDay} 
                          onSuccess={handleRefresh}
                        >
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </ServiceDayDialog>
                        
                        <DeleteServiceDayDialog 
                          id={serviceDay.id} 
                          onSuccess={handleRefresh}
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
