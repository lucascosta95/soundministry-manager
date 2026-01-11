"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { OperatorDialog } from "@/components/operators/operator-dialog"
import { DeleteOperatorDialog } from "@/components/operators/delete-operator-dialog"
import { format } from "date-fns"
import { ptBR, enUS } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"

import { SoundOperator } from "@/components/operators/operator-dialog"

export default function OperatorsPage() {
  const t = useTranslations("operators")
  const tc = useTranslations("common")
  const [operators, setOperators] = useState<SoundOperator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedOperator, setSelectedOperator] = useState<SoundOperator | null>(null)
  const [serviceDays, setServiceDays] = useState<{ id: string; name: string; weekDay: number }[]>([])
  const { toast } = useToast()

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [operatorsRes, serviceDaysRes] = await Promise.all([
        fetch("/api/operators"),
        fetch("/api/service-days"),
      ])

      if (operatorsRes.ok) {
        const operatorsData = await operatorsRes.json()
        setOperators(operatorsData)
      }

      if (serviceDaysRes.ok) {
        const serviceDaysData = await serviceDaysRes.json()
        setServiceDays(serviceDaysData)
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: t("error"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleEdit = (operator: SoundOperator) => {
    setSelectedOperator(operator)
    setDialogOpen(true)
  }

  const handleDelete = (operator: SoundOperator) => {
    setSelectedOperator(operator)
    setDeleteDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedOperator(null)
    setDialogOpen(true)
  }

  const handleSuccess = () => {
    loadData()
    setDialogOpen(false)
    setDeleteDialogOpen(false)
  }

  const getDayLabel = (dayIdOrName: string) => {
    const serviceDay = serviceDays.find(sd => sd.id === dayIdOrName)
    if (serviceDay) {
      const days = [
        t("sunday"),
        t("monday"),
        t("tuesday"),
        t("wednesday"),
        t("thursday"),
        t("friday"),
        t("saturday"),
      ]
      return days[serviceDay.weekDay] || serviceDay.name
    }

    return dayIdOrName
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("subtitle")}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t("newOperator")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {tc("loading")}
            </div>
          ) : operators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("noOperators")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("birthday")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("monthlyAvailability")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("canWorkAlone")}</TableHead>
                    <TableHead className="hidden xl:table-cell">{t("weeklyAvailability")}</TableHead>
                    <TableHead className="text-right">{tc("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operators.map((operator) => (
                    <TableRow key={operator.id}>
                      <TableCell className="font-medium">{operator.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(new Date(operator.birthday), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {operator.monthlyAvailability}x
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {operator.canWorkAlone ? tc("yes") : tc("no")}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {operator.weeklyAvailability.map((day) => (
                            <span
                              key={day}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-primary/10 text-primary"
                            >
                              {getDayLabel(day).substring(0, 3)}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(operator)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(operator)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <OperatorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        operator={selectedOperator}
        onSuccess={handleSuccess}
      />

      <DeleteOperatorDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        operator={selectedOperator}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
