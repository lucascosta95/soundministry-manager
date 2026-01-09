"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UsersRound, CalendarX } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function DashboardPage() {
  const t = useTranslations("dashboard")
  const tn = useTranslations("nav")
  const [stats, setStats] = useState({
    operators: 0,
    pairs: 0,
    restrictions: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [operatorsRes, pairsRes, restrictionsRes] = await Promise.all([
          fetch("/api/operators"),
          fetch("/api/pairs"),
          fetch("/api/restrictions"),
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
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      }
    }

    fetchStats()
  }, [])

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
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("subtitle")}
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

      <Card>
        <CardHeader>
          <CardTitle>{t("welcome")}</CardTitle>
          <CardDescription>
            {t("welcomeDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("intro")}
          </p>
          <div className="space-y-2">
            <h3 className="font-semibold">{t("featuresTitle")}</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>{t("feature1")}</li>
              <li>{t("feature2")}</li>
              <li>{t("feature3")}</li>
              <li>{t("feature4")}</li>
              <li>{t("feature5")}</li>
              <li>{t("feature6")}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
