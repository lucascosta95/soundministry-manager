"use client"

import {useFormatter, useTranslations} from "next-intl"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {ArrowRight, Calendar as CalendarIcon, CalendarX, Users, UsersRound} from "lucide-react"
import {useEffect, useState} from "react"
import Link from "next/link"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"

interface ScheduleEvent {
  id: string
  date: string // ISO string
  name: string
  assignments: {
    id: string
    operator: {
      name: string
    }
  }[]
}

interface Schedule {
  id: string
  month: number
  year: number
  status: string
  events: ScheduleEvent[]
}

interface DashboardStats {
  operators: number
  pairs: number
  restrictions: number
}

interface DashboardClientPageProps {
  stats: DashboardStats
  userName: string
  currentSchedule: Schedule | null
}

export default function DashboardClientPage({ stats, userName, currentSchedule }: DashboardClientPageProps) {
  const t = useTranslations("dashboard")
  const tn = useTranslations("nav")
  const formatDateTime = useFormatter()
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    const now = new Date()
    setCurrentDate(now)

    const hour = now.getHours()
    const name = userName.split(" ")[0]
    
    if (hour >= 5 && hour < 12) setGreeting(t("goodMorning", { name }))
    else if (hour >= 12 && hour < 18) setGreeting(t("goodAfternoon", { name }))
    else setGreeting(t("goodEvening", { name }))
  }, [userName, t])

  const getMonthName = (month: number) => {
    const date = new Date()
    date.setMonth(month - 1)
    return formatDateTime.dateTime(date, { month: 'long' })
  }

  const cards = [
    {
      title: tn("operators"),
      description: t("manageOperators"),
      icon: Users,
      value: stats.operators,
      href: "/operators",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: tn("pairs"),
      description: t("managePairs"),
      icon: UsersRound,
      value: stats.pairs,
      href: "/pairs",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: tn("restrictions"),
      description: t("manageRestrictions"),
      icon: CalendarX,
      value: stats.restrictions,
      href: "/restrictions",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
            {greeting || <span className="invisible">Loading...</span>}
        </h1>
        <p className="text-muted-foreground mt-2">
          {currentDate && formatDateTime.dateTime(currentDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">{t("scheduleOf")} {currentSchedule ? getMonthName(currentSchedule.month) : t("thisMonth")}</h2>
            {currentSchedule && (
                <Link href={`/schedules/${currentSchedule.id}`}>
                    <Button variant="outline" size="sm">
                        {t("viewComplete")} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            )}
        </div>

        {currentSchedule ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {currentSchedule.events.map((event) => (
                    <Card key={event.id}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                        {formatDateTime.dateTime(new Date(event.date), { day: '2-digit', month: '2-digit' })}
                                    </span>
                                </div>
                                <Badge variant="secondary" className="text-xs">{event.name}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {event.assignments.length > 0 ? (
                                    event.assignments.map((assignment) => (
                                        <div key={assignment.id} className="flex items-center gap-2 text-sm">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            <span>{assignment.operator.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-sm text-muted-foreground italic">{t("noOperators")}</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
            <Card className="bg-muted/50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg">{t("noScheduleFound")}</h3>
                    <p className="text-muted-foreground text-sm mt-1 mb-4">
                        {t("noScheduleFoundDesc")}
                    </p>
                    <Link href="/schedules">
                        <Button>{t("goToSchedules")}</Button>
                    </Link>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  )
}
