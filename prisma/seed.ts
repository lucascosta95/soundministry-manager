import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar usuário admin padrão
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@soundministry.com' },
    update: {},
    create: {
      email: 'admin@soundministry.com',
      password: hashedPassword,
      name: 'Administrador',
    },
  })

  console.log('✅ Usuário admin criado:', user.email)

  // Criar alguns sonoplastas de exemplo
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

  console.log('✅ Sonoplastas de exemplo criados')

  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
