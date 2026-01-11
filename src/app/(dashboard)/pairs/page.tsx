"use client"

import {useEffect, useState} from "react"
import {useTranslations} from "next-intl"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader} from "@/components/ui/card"
import {Skeleton} from "@/components/ui/skeleton"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {Plus, Trash2} from "lucide-react"
import {PairDialog} from "@/components/pairs/pair-dialog"
import {DeletePairDialog} from "@/components/pairs/delete-pair-dialog"
import {useToast} from "@/components/ui/use-toast"

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
  createdAt: string
}

export default function PairsPage() {
  const t = useTranslations("pairs")
  const tc = useTranslations("common")
  const [pairs, setPairs] = useState<PreferredPair[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPair, setSelectedPair] = useState<PreferredPair | null>(null)
  const { toast } = useToast()

  const fetchPairs = async () => {
    try {
      const response = await fetch("/api/pairs")
      const data = await response.json()
      setPairs(data)
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
    fetchPairs()
  }, [])

  const handleDelete = (pair: PreferredPair) => {
    setSelectedPair(pair)
    setDeleteDialogOpen(true)
  }

  const handleCreate = () => {
    setDialogOpen(true)
  }

  const handleSuccess = () => {
    fetchPairs()
    setDialogOpen(false)
    setDeleteDialogOpen(false)
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
          {t("newPair")}
        </Button>
      </div>

      <Card>
        <CardHeader></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(10).fill(null).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : pairs.length === 0 ? (
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
