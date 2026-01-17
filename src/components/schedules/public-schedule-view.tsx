"use client"

import {memo} from "react"
import {useFormatter, useTranslations} from "next-intl"
import {Calendar} from "lucide-react"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"

interface Operator {
  id: string
  name: string
  canWorkAlone: boolean
}

interface Assignment {
  id: string
  operator: Operator
  isManual: boolean
}

interface ScheduleEvent {
  id: string
  date: string
  name: string
  minOperators: number
  maxOperators: number
  assignments: Assignment[]
}

export interface ScheduleWithDetails {
  id: string
  month: number
  year: number
  status: string
  events: ScheduleEvent[]
}

interface PublicScheduleViewProps {
  schedule: ScheduleWithDetails
}

const PublicEventCard = memo(({ event }: { event: ScheduleEvent }) => {
  const format = useFormatter()
  const t = useTranslations("schedules")
  const date = new Date(event.date)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">
              {format.dateTime(date, { day: '2-digit', month: 'long' })}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({format.dateTime(date, { weekday: 'long' })})
              </span>
            </CardTitle>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <Badge variant="outline">{event.name}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.assignments.map((assignment) => (
              <div 
                key={assignment.id} 
                className="flex items-center justify-between p-3 border rounded-md bg-card"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-medium">{assignment.operator.name}</span>
                </div>
              </div>
            ))}
            {event.assignments.length === 0 && (
              <div className="col-span-full py-4 text-center text-sm text-muted-foreground border border-dashed rounded-md">
                {t("noOperatorsAssignedBox")}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

PublicEventCard.displayName = "PublicEventCard"

export function PublicScheduleView({ schedule }: PublicScheduleViewProps) {
  const t = useTranslations("schedules")
  const format = useFormatter()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight capitalize">
              {format.dateTime(new Date(schedule.year, schedule.month - 1), { month: 'long' })} {schedule.year}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={schedule.status === "PUBLISHED" ? "default" : "secondary"}>
                {schedule.status === "PUBLISHED" ? t("statusPublished") : t("statusDraft")}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {schedule.events.length} {t("eventsCountSuffix")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {schedule.events.map((event) => (
          <PublicEventCard 
            key={event.id} 
            event={event} 
          />
        ))}
      </div>
    </div>
  )
}
