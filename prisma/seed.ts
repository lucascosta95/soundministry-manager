import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@soundministry.com' },
    update: {},
    create: {
      email: 'admin@soundministry.com',
      password: hashedPassword,
      name: 'Administrator',
      role: 'ADMIN',
      preferredTheme: 'system',
      preferredLocale: 'pt-BR',
    },
  })

  console.log('✅ Admin user created:', user.email)

  const operator1 = await prisma.soundOperator.upsert({
    where: { id: 'example-1' },
    update: {},
    create: {
      id: 'example-1',
      name: 'João Silva',
      birthday: new Date('1990-05-15'),
      monthlyAvailability: 4,
      weeklyAvailability: ['WEDNESDAY', 'SATURDAY', 'SUNDAY'],
      annualAvailability: [
        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
      ],
    },
  })

  const operator2 = await prisma.soundOperator.upsert({
    where: { id: 'example-2' },
    update: {},
    create: {
      id: 'example-2',
      name: 'Maria Santos',
      birthday: new Date('1995-08-20'),
      monthlyAvailability: 3,
      weeklyAvailability: ['SATURDAY', 'SUNDAY'],
      annualAvailability: [
        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
      ],
    },
  })

  console.log('✅ Example operators created')

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
