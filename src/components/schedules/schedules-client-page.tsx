"use client"

import {useTranslations} from "next-intl"
import {Eye, Plus, Trash2} from "lucide-react"
import Link from "next/link"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader} from "@/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {GenerateScheduleDialog} from "@/components/schedules/generate-schedule-dialog"
import {DeleteScheduleDialog} from "@/components/schedules/delete-schedule-dialog"
import {Badge} from "@/components/ui/badge"
import {useRouter} from "next/navigation"

interface Schedule {
  id: string
  month: number
  year: number
  status: string
  _count: {
    events: number
  }
}

interface SchedulesClientPageProps {
    schedules: Schedule[]
}

export default function SchedulesClientPage({ schedules }: SchedulesClientPageProps) {
  const t = useTranslations("schedules")
  const tm = useTranslations("months")
  const tc = useTranslations("common")
  const router = useRouter()

  const handleRefresh = () => {
      router.refresh()
  }

  const getMonthName = (month: number) => {
    const months = [
      "", "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ]

    if (month < 1 || month > 12) return ""
    return tm(months[month] as any)
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
        <GenerateScheduleDialog onSuccess={handleRefresh}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("newSchedule")}
          </Button>
        </GenerateScheduleDialog>
      </div>

      <Card>
        <CardHeader></CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("noSchedules")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("month")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("year")}</TableHead>
                  <TableHead className="hidden md:table-cell">Eventos</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="text-right">{tc("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      {getMonthName(schedule.month)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {schedule.year}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {schedule._count?.events || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={schedule.status === "PUBLISHED" ? "default" : "secondary"}>
                        {schedule.status === "PUBLISHED" ? t("statusPublished") : t("statusDraft")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/schedules/${schedule.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        
                        <DeleteScheduleDialog 
                          id={schedule.id} 
                          onSuccess={handleRefresh}
                        >
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DeleteScheduleDialog>
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
