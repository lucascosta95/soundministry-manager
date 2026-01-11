"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Check, ChevronsUpDown, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface SoundOperator {
  id: string
  name: string
}

interface AddOperatorDialogProps {
  eventId: string
  onSuccess: () => void
  assignedOperatorIds: string[]
}

export function AddOperatorDialog({ eventId, onSuccess, assignedOperatorIds }: AddOperatorDialogProps) {
  const [open, setOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [operators, setOperators] = useState<SoundOperator[]>([])
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const t = useTranslations("schedules")
  const tc = useTranslations("common")
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchOperators()
    }
  }, [open])

  const fetchOperators = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/operators")
      if (response.ok) {
        const data = await response.json()
        setOperators(data)
      }
    } catch (error) {
      console.error("Failed to fetch operators:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedOperatorId) return

    setSaving(true)
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          operatorId: selectedOperatorId,
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Operador adicionado com sucesso",
        })
        onSuccess()
        setOpen(false)
        setSelectedOperatorId("")
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || "Falha ao adicionar operador",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar operador",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Filter out already assigned operators
  const availableOperators = operators.filter(op => !assignedOperatorIds.includes(op.id))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Operador</DialogTitle>
          <DialogDescription>
            Selecione um operador para adicionar a este evento.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={popoverOpen}
                className="w-full justify-between"
              >
                {selectedOperatorId
                  ? operators.find((op) => op.id === selectedOperatorId)?.name
                  : "Selecione um operador..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command>
                <CommandInput placeholder="Buscar operador..." />
                <CommandList>
                    <CommandEmpty>Nenhum operador encontrado.</CommandEmpty>
                    <CommandGroup>
                    {availableOperators.map((operator) => (
                        <CommandItem
                        key={operator.id}
                        value={operator.name}
                        onSelect={() => {
                            setSelectedOperatorId(operator.id)
                            setPopoverOpen(false)
                        }}
                        >
                        <Check
                            className={cn(
                            "mr-2 h-4 w-4",
                            selectedOperatorId === operator.id ? "opacity-100" : "opacity-0"
                            )}
                        />
                        {operator.name}
                        </CommandItem>
                    ))}
                    </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!selectedOperatorId || saving}>
            {saving ? tc("saving") : tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
