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
import { RestrictionDialog } from "@/components/restrictions/restriction-dialog"
import { DeleteRestrictionDialog } from "@/components/restrictions/delete-restriction-dialog"
import { useToast } from "@/components/ui/use-toast"

import { MonthlyRestriction } from "@/components/restrictions/restriction-dialog"

export default function RestrictionsPage() {
  const t = useTranslations("restrictions")
  const tm = useTranslations("months")
  const tc = useTranslations("common")
  const [restrictions, setRestrictions] = useState<MonthlyRestriction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRestriction, setSelectedRestriction] = useState<MonthlyRestriction | null>(null)
  const { toast } = useToast()

  const fetchRestrictions = async () => {
    try {
      const response = await fetch("/api/restrictions")
      const data = await response.json()
      setRestrictions(data)
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
    fetchRestrictions()
  }, [])

  const handleEdit = (restriction: MonthlyRestriction) => {
    setSelectedRestriction(restriction)
    setDialogOpen(true)
  }

  const handleDelete = (restriction: MonthlyRestriction) => {
    setSelectedRestriction(restriction)
    setDeleteDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedRestriction(null)
    setDialogOpen(true)
  }

  const handleSuccess = () => {
    fetchRestrictions()
    setDialogOpen(false)
    setDeleteDialogOpen(false)
  }

  const getMonthName = (month: number) => {
    const months = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ]
    return tm(months[month - 1] as any)
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
          {t("newRestriction")}
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
          ) : restrictions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("noRestrictions")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("operator")}</TableHead>
                    <TableHead>{t("month")}/{t("year")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("restrictedDays")}</TableHead>
                    <TableHead className="text-right">{tc("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restrictions.map((restriction) => (
                    <TableRow key={restriction.id}>
                      <TableCell className="font-medium">
                        {restriction.operator?.name || "Desconhecido"}
                      </TableCell>
                      <TableCell>
                        {getMonthName(restriction.month)}/{restriction.year}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {restriction.restrictedDays.sort((a, b) => a - b).map((day) => (
                            <span
                              key={day}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs bg-destructive/10 text-destructive font-medium"
                            >
                              {day}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(restriction)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(restriction)}
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

      <RestrictionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        restriction={selectedRestriction}
        onSuccess={handleSuccess}
      />

      <DeleteRestrictionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        restriction={selectedRestriction}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
