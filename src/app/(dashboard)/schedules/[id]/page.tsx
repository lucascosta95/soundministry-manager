"use client"

import {useEffect, useState} from "react"
import {useTranslations} from "next-intl"
import {useParams, useRouter} from "next/navigation"
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
import {format} from "date-fns"
import {ptBR} from "date-fns/locale"

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

interface Schedule {
  id: string
  month: number
  year: number
  status: string
  events: ScheduleEvent[]
}

export default function ScheduleDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const t = useTranslations("schedules")
  const tm = useTranslations("months")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null)

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`/api/schedules/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setSchedule(data)
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar a escala",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to fetch schedule:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar a escala",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchSchedule()
    }
  }, [params.id])

  const [copied, setCopied] = useState(false)

  const handleUpdateStatus = async () => {
    if (!schedule) return

    const newStatus = schedule.status === "DRAFT" ? "PUBLISHED" : "DRAFT"
    
    try {
      const response = await fetch(`/api/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Escala ${newStatus === "PUBLISHED" ? "publicada" : "revertida para rascunho"} com sucesso`,
        })
        fetchSchedule()
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar status da escala",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da escala",
        variant: "destructive",
      })
    }
  }

  const handleCopyToClipboard = () => {
    if (!schedule) return

    const monthName = getMonthName(schedule.month)
    let text = `*Escala de Sonoplastia - ${monthName} ${schedule.year}*\n\n`

    schedule.events.forEach((event) => {
      const date = format(new Date(event.date), "dd/MM", { locale: ptBR })
      const weekDay = format(new Date(event.date), "EEEE", { locale: ptBR })
      const operators = event.assignments.map(a => a.operator.name).join(" e ")

      text += `📅 *${date} (${weekDay})* - ${event.name}\n`
      text += `👤 ${operators || "Nenhum operador"}\n\n`
    })

    navigator.clipboard.writeText(text)
    setCopied(true)
    toast({
      title: "Copiado!",
      description: "Escala copiada para a área de transferência.",
    })

    setTimeout(() => setCopied(false), 2000)
  }

  const getMonthName = (month: number) => {
    const months = [
      "", "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ]
    if (month < 1 || month > 12) return ""
    return tm(months[month] as any)
  }

  const handleRemoveAssignment = async () => {
    if (!assignmentToDelete) return

    try {
      const response = await fetch(`/api/assignments/${assignmentToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Operador removido com sucesso",
        })
        fetchSchedule()
      } else {
        toast({
          title: "Erro",
          description: "Falha ao remover operador",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover operador",
        variant: "destructive",
      })
    } finally {
      setAssignmentToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-muted-foreground">{tc("loading")}</div>
      </div>
    )
  }

  if (!schedule) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <h2 className="text-xl font-semibold">Escala não encontrada</h2>
        <Button onClick={() => router.push("/schedules")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Escalas
        </Button>
      </div>
    )
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
              {getMonthName(schedule.month)} {schedule.year}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={schedule.status === "PUBLISHED" ? "default" : "secondary"}>
                {schedule.status === "PUBLISHED" ? t("statusPublished") : t("statusDraft")}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {schedule.events.length} eventos
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyToClipboard}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copiado" : "Copiar"}
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
            </Button>
            <Button 
                onClick={handleUpdateStatus}
                variant={schedule.status === "PUBLISHED" ? "secondary" : "default"}
            >
                {schedule.status === "PUBLISHED" ? (
                    <>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Reverter para Rascunho
                    </>
                ) : (
                    <>
                        <Save className="mr-2 h-4 w-4" />
                        Publicar Escala
                    </>
                )}
            </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {schedule.events.map((event) => (
          <Card key={event.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-lg">
                        {format(new Date(event.date), "dd 'de' MMMM", { locale: ptBR })}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            ({format(new Date(event.date), "EEEE", { locale: ptBR })})
                        </span>
                    </CardTitle>
                </div>
                <Badge variant="outline">{event.name}</Badge>
                <AddOperatorDialog 
                  eventId={event.id} 
                  onSuccess={fetchSchedule}
                  assignedOperatorIds={event.assignments.map(a => a.operator.id)}
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
                                        <Badge variant="secondary" className="text-[10px] h-5">Manual</Badge>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => setAssignmentToDelete(assignment.id)}
                                        title="Remover operador"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {event.assignments.length === 0 && (
                            <div className="col-span-full py-4 text-center text-sm text-muted-foreground border border-dashed rounded-md">
                                Nenhum operador escalado
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!assignmentToDelete} onOpenChange={(open) => !open && setAssignmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover operador?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este operador do evento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAssignment} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
