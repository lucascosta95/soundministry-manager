"use client"

import {useState} from "react"
import {useTranslations} from "next-intl"
import {Check, ChevronsUpDown, UserPlus} from "lucide-react"
import {Button} from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,} from "@/components/ui/command"
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover"
import {cn} from "@/lib/utils"
import {useToast} from "@/components/ui/use-toast"
import {createAssignment} from "@/actions/assignments"

interface SoundOperator {
  id: string
  name: string
}

interface AddOperatorDialogProps {
  eventId: string
  onSuccess: () => void
  assignedOperatorIds: string[]
  operators: SoundOperator[]
}

export function AddOperatorDialog({ eventId, onSuccess, assignedOperatorIds, operators }: AddOperatorDialogProps) {
  const [open, setOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const t = useTranslations("schedules")
  const tc = useTranslations("common")
  const { toast } = useToast()

  const handleSave = async () => {
    if (!selectedOperatorId) return

    setSaving(true)
    try {
        const result = await createAssignment(eventId, selectedOperatorId)

      if (result.success) {
        toast({
          title: t("operatorAddedSuccess"),
          description: t("operatorAddedSuccess"),
        })
        onSuccess()
        setOpen(false)
        setSelectedOperatorId("")
      } else {
        toast({
          title: t("addOperatorErrorGeneric"),
          description: result.error || t("addOperatorError"),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("addOperatorErrorGeneric"),
        description: t("addOperatorError"),
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
          {t("add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("addOperator")}</DialogTitle>
          <DialogDescription>
            {t("selectOperatorDescription")}
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
                  : t("selectOperatorPlaceholder")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command>
                <CommandInput placeholder={t("searchOperatorPlaceholder")} />
                <CommandList>
                    <CommandEmpty>{t("noOperatorFound")}</CommandEmpty>
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
            {saving ? tc("loading") : tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
