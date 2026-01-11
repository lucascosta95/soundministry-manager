"use client"

import {useTranslations} from "next-intl"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {ArrowRight, Calendar as CalendarIcon, CalendarX, Users, UsersRound} from "lucide-react"
import {useEffect, useState} from "react"
import Link from "next/link"
import {format} from "date-fns"
import {ptBR} from "date-fns/locale"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Skeleton} from "@/components/ui/skeleton"

interface ScheduleEvent {
  id: string
  date: string
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

interface UserProfile {
  name: string
}

export default function DashboardPage() {
  const t = useTranslations("dashboard")
  const tn = useTranslations("nav")
  const [stats, setStats] = useState({
    operators: 0,
    pairs: 0,
    restrictions: 0,
  })
  const [user, setUser] = useState<UserProfile | null>(null)
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [operatorsRes, pairsRes, restrictionsRes, profileRes, schedulesRes] = await Promise.all([
          fetch("/api/operators"),
          fetch("/api/pairs"),
          fetch("/api/restrictions"),
          fetch("/api/profile"),
          fetch("/api/schedules")
        ])
        
        const [operators, pairs, restrictions] = await Promise.all([
          operatorsRes.json(),
          pairsRes.json(),
          restrictionsRes.json(),
        ])

        setStats({
          operators: operators.length || 0,
          pairs: pairs.length || 0,
          restrictions: restrictions.length || 0,
        })

        if (profileRes.ok) {
          const userData = await profileRes.json()
          setUser(userData)
        }

        if (schedulesRes.ok) {
          const schedules: Schedule[] = await schedulesRes.json()
          const now = new Date()
          const currentMonth = now.getMonth() + 1
          const currentYear = now.getFullYear()

          const foundSchedule = schedules.find(
            s => s.month === currentMonth && s.year === currentYear
          )

          if (foundSchedule) {
            const detailRes = await fetch(`/api/schedules/${foundSchedule.id}`)
            if (detailRes.ok) {
              const detailData = await detailRes.json()
              setCurrentSchedule(detailData)
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    const name = user?.name?.split(" ")[0] || ""
    
    if (hour >= 5 && hour < 12) return t("goodMorning", { name })
    if (hour >= 12 && hour < 18) return t("goodAfternoon", { name })
    return t("goodEvening", { name })
  }

  const getMonthName = (month: number) => {
    const date = new Date()
    date.setMonth(month - 1)
    return format(date, "MMMM", { locale: ptBR })
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

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(null).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-12 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array(12).fill(null).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-1.5 w-1.5 rounded-full" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-1.5 w-1.5 rounded-full" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-1.5 w-1.5 rounded-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{getGreeting()}</h1>
        <p className="text-muted-foreground mt-2">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
            <h2 className="text-2xl font-semibold tracking-tight">Escala de {currentSchedule ? getMonthName(currentSchedule.month) : "Este Mês"}</h2>
            {currentSchedule && (
                <Link href={`/schedules/${currentSchedule.id}`}>
                    <Button variant="outline" size="sm">
                        Ver Completa <ArrowRight className="ml-2 h-4 w-4" />
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
                                        {format(new Date(event.date), "dd/MM", { locale: ptBR })}
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
                                    <span className="text-sm text-muted-foreground italic">Sem operadores</span>
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
                    <h3 className="font-semibold text-lg">Nenhuma escala encontrada para este mês</h3>
                    <p className="text-muted-foreground text-sm mt-1 mb-4">
                        A escala deste mês ainda não foi gerada.
                    </p>
                    <Link href="/schedules">
                        <Button>Ir para Escalas</Button>
                    </Link>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  )
}
