"use client"

import {useState} from "react"
import {useTranslations} from "next-intl"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader} from "@/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {Plus, Trash2} from "lucide-react"
import {PairDialog} from "@/components/pairs/pair-dialog"
import {DeletePairDialog} from "@/components/pairs/delete-pair-dialog"
import {useRouter} from "next/navigation"

type PreferredPair = {
  id: string
  firstOperator: {
    id: string
    name: string
  }
  secondOperator: {
    id: string
    name: string
  }
  createdAt: Date // Changed to Date since it's coming from Prisma directly
}

type SoundOperator = {
  id: string
  name: string
}

interface PairsClientPageProps {
    pairs: PreferredPair[]
    operators: SoundOperator[]
}

export default function PairsClientPage({ pairs, operators }: PairsClientPageProps) {
  const t = useTranslations("pairs")
  const tc = useTranslations("common")
  const router = useRouter()
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPair, setSelectedPair] = useState<PreferredPair | null>(null)

  const handleDelete = (pair: PreferredPair) => {
    setSelectedPair(pair)
    setDeleteDialogOpen(true)
  }

  const handleCreate = () => {
    setDialogOpen(true)
  }

  const handleSuccess = () => {
    setDialogOpen(false)
    setDeleteDialogOpen(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("subtitle")}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t("newPair")}
        </Button>
      </div>

      <Card>
        <CardHeader></CardHeader>
        <CardContent>
          {pairs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("noPairs")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("firstOperator")}</TableHead>
                    <TableHead>{t("secondOperator")}</TableHead>
                    <TableHead className="text-right">{tc("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pairs.map((pair) => (
                    <TableRow key={pair.id}>
                      <TableCell className="font-medium">
                        {pair.firstOperator.name}
                      </TableCell>
                      <TableCell className="font-medium">
                        {pair.secondOperator.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(pair)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PairDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
        operators={operators}
      />

      <DeletePairDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        pair={selectedPair}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
