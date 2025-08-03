import { PrismaClient } from '@prisma/client'
import { DEPARTMENTS } from '../constants'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.feedback.deleteMany()
  await prisma.investigationResult.deleteMany()
  await prisma.examinationResult.deleteMany()
  await prisma.message.deleteMany()
  await prisma.case.deleteMany()
  await prisma.pediatricProfile.deleteMany()
  await prisma.patientProfile.deleteMany()
  await prisma.subspecialty.deleteMany()
  await prisma.department.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  console.log('🗑️  Cleared existing data')

  // Seed departments and subspecialties
  for (const dept of DEPARTMENTS) {
    const department = await prisma.department.create({
      data: {
        name: dept.name,
        subspecialties: {
          create: dept.subspecialties?.map(sub => ({
            name: sub.name
          })) || []
        }
      }
    })

    console.log(`✅ Created department: ${department.name}`)
  }

  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 