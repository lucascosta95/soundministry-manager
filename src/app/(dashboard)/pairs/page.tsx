import {prisma} from "@/lib/prisma"
import PairsClientPage from "@/components/pairs/pairs-client-page"

export default async function PairsPage() {
  const [pairs, operators] = await Promise.all([
    prisma.preferredPair.findMany({
        include: {
            firstOperator: { select: { id: true, name: true } },
            secondOperator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
    }),
    prisma.soundOperator.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    }),
  ])

  return <PairsClientPage pairs={pairs} operators={operators} />
}
