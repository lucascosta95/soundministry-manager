"use client"

import {useEffect, useState} from "react"
import {useTranslations} from "next-intl"
import {Eye, Plus, Trash2} from "lucide-react"
import Link from "next/link"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader} from "@/components/ui/card"
import {Skeleton} from "@/components/ui/skeleton"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {GenerateScheduleDialog} from "@/components/schedules/generate-schedule-dialog"
import {DeleteScheduleDialog} from "@/components/schedules/delete-schedule-dialog"
import {Badge} from "@/components/ui/badge"
import {useToast} from "@/components/ui/use-toast"

interface Schedule {
  id: string
  month: number
  year: number
  status: string
  _count: {
    events: number
  }
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations("schedules")
  const tm = useTranslations("months")
  const tc = useTranslations("common")
  const { toast } = useToast()

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/schedules")
      if (response.ok) {
        const data = await response.json()
        setSchedules(data)
      } else {
        const error = await response.json()
        toast({
            title: "Error fetching schedules",
            description: error.error,
            variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error)
      toast({
          title: "Error",
          description: "Failed to fetch schedules",
          variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  const getMonthName = (month: number) => {
    const months = [
      "", "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ]

    if (month < 1 || month > 12) return ""
    return tm(months[month] as any)
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
        <GenerateScheduleDialog onSuccess={fetchSchedules}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("newSchedule")}
          </Button>
        </GenerateScheduleDialog>
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
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("noSchedules")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("month")}</TableHead>
                  <TableHead>{t("year")}</TableHead>
                  <TableHead>Eventos</TableHead>
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
                    <TableCell>
                      {schedule.year}
                    </TableCell>
                    <TableCell>
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
                          onSuccess={fetchSchedules}
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
