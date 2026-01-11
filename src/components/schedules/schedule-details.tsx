"use client"

import {memo, useCallback, useState} from "react"
import {useFormatter, useTranslations} from "next-intl"
import {useRouter} from "next/navigation"
import {ArrowLeft, Calendar, Check, Copy, Printer, Save, Trash2} from "lucide-react"
import {AddOperatorDialog} from "@/components/schedules/add-operator-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {useToast} from "@/components/ui/use-toast"

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

interface ScheduleDetailsProps {
  schedule: ScheduleWithDetails
  operators: { id: string; name: string }[]
}

const EventCard = memo(({ event, onRemoveAssignment, operators, onSuccess }: { 
  event: ScheduleEvent
  onRemoveAssignment: (id: string) => void
  operators: { id: string; name: string }[]
  onSuccess: () => void
}) => {
  const format = useFormatter()
  const t = useTranslations("schedules")
  const date = new Date(event.date)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">
              {format.dateTime(date, { day: '2-digit', month: 'long' })}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({format.dateTime(date, { weekday: 'long' })})
              </span>
            </CardTitle>
          </div>
          <Badge variant="outline">{event.name}</Badge>
          <AddOperatorDialog 
            eventId={event.id} 
            onSuccess={onSuccess}
            assignedOperatorIds={event.assignments.map(a => a.operator.id)}
            operators={operators}
          />
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
                <div className="flex items-center gap-2">
                  {assignment.isManual && (
                    <Badge variant="secondary" className="text-[10px] h-5">{t("manual")}</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveAssignment(assignment.id)}
                    title={t("removeOperatorTooltip")}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
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

EventCard.displayName = "EventCard"

export function ScheduleDetails({ schedule, operators }: ScheduleDetailsProps) {
  const router = useRouter()
  const t = useTranslations("schedules")
  const tc = useTranslations("common")
  const format = useFormatter()
  const { toast } = useToast()
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const refreshData = useCallback(() => {
    router.refresh()
  }, [router])

  const handleUpdateStatus = async () => {
    const newStatus = schedule.status === "DRAFT" ? "PUBLISHED" : "DRAFT"
    
    try {
      const response = await fetch(`/api/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast({
          title: newStatus === "PUBLISHED" ? t("publishSuccess") : t("revertSuccess"),
        })
        refreshData()
      } else {
        toast({
          title: t("updateStatusError"),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("updateStatusError"),
        variant: "destructive",
      })
    }
  }

  const handleCopyToClipboard = () => {
    const monthName = format.dateTime(new Date(schedule.year, schedule.month - 1), { month: 'long' })
    let text = `*${t("scheduleTitlePrefix")} ${monthName} ${schedule.year}*\n\n`

    schedule.events.forEach((event) => {
      const date = new Date(event.date)
      const dateStr = format.dateTime(date, { day: '2-digit', month: '2-digit' })
      const weekDay = format.dateTime(date, { weekday: 'long' })
      const operatorsList = event.assignments.map(a => a.operator.name).join(" e ")

      text += `📅 *${dateStr} (${weekDay})* - ${event.name}\n`
      text += `👤 ${operatorsList || t("noOperatorsAssigned")}\n\n`
    })

    navigator.clipboard.writeText(text)
    setCopied(true)
    toast({
      title: t("copied"),
      description: t("copySuccess"),
    })

    setTimeout(() => setCopied(false), 2000)
  }

  const handleRemoveAssignment = async () => {
    if (!assignmentToDelete) return

    try {
      const response = await fetch(`/api/assignments/${assignmentToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: t("removeOperatorSuccess"),
        })
        refreshData()
      } else {
        toast({
          title: t("removeOperatorError"),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("removeOperatorErrorGeneric"),
        variant: "destructive",
      })
    } finally {
      setAssignmentToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/schedules")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
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
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyToClipboard}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? t("copied") : t("copy")}
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                {t("print")}
            </Button>
            <Button 
                onClick={handleUpdateStatus}
                variant={schedule.status === "PUBLISHED" ? "secondary" : "default"}
            >
                {schedule.status === "PUBLISHED" ? (
                    <>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t("revertToDraft")}
                    </>
                ) : (
                    <>
                        <Save className="mr-2 h-4 w-4" />
                        {t("publishSchedule")}
                    </>
                )}
            </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {schedule.events.map((event) => (
          <EventCard 
            key={event.id} 
            event={event} 
            onRemoveAssignment={setAssignmentToDelete}
            operators={operators}
            onSuccess={refreshData}
          />
        ))}
      </div>

      <AlertDialog open={!!assignmentToDelete} onOpenChange={(open) => !open && setAssignmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeOperatorTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("removeOperatorConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAssignment} className="bg-destructive hover:bg-destructive/90">
              {tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
