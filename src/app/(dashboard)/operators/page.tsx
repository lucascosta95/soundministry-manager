import {prisma} from "@/lib/prisma"
import OperatorsClientPage from "@/components/operators/operators-client-page"

export default async function OperatorsPage() {
  const [operatorsData, serviceDays] = await Promise.all([
    prisma.soundOperator.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.serviceDay.findMany({
      orderBy: { weekDay: "asc" },
    }),
  ])

  const operators = operatorsData.map((op) => ({
    ...op,
    birthday: op.birthday.toISOString(),
  }))

  return (
    <OperatorsClientPage 
      operators={operators} 
      serviceDays={serviceDays} 
    />
  )
}
