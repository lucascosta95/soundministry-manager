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

  // Serialize dates to pass to client component
  const operators = operatorsData.map((op) => ({
    ...op,
    birthday: op.birthday.toISOString(), // Convert Date to ISO string
  }))

  return (
    <OperatorsClientPage 
      operators={operators} 
      serviceDays={serviceDays} 
    />
  )
}
