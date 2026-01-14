import {prisma} from "@/lib/prisma"
import RestrictionsClientPage from "@/components/restrictions/restrictions-client-page"

export default async function RestrictionsPage() {
  const [restrictions, operators] = await Promise.all([
    prisma.monthlyRestriction.findMany({
        include: {
            operator: { select: { name: true } },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
    prisma.soundOperator.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    }),
  ])

  return <RestrictionsClientPage restrictions={restrictions} operators={operators} />
}
