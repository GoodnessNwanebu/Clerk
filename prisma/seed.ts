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

  // Create a dummy user and completed case for testing
  const dummyUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      country: 'Nigeria'
    }
  });

  const cardiologyDept = await prisma.department.findFirst({
    where: { name: 'Cardiology' }
  });

  if (cardiologyDept) {
    // Create a dummy patient profile
    const patientProfile = await prisma.patientProfile.create({
      data: {
        educationLevel: 'well-informed',
        healthLiteracy: 'high',
        occupation: 'Engineer',
        recordKeeping: 'detailed'
      }
    });

    // Create a dummy completed case
    const completedCase = await prisma.case.create({
      data: {
        userId: dummyUser.id,
        departmentId: cardiologyDept.id,
        diagnosis: 'Acute Myocardial Infarction',
        primaryInfo: '58-year-old male with chest pain radiating to left arm',
        openingLine: 'I have severe chest pain that started 2 hours ago',
        isPediatric: false,
        difficultyLevel: 'intermediate',
        preliminaryDiagnosis: 'Acute coronary syndrome',
        examinationPlan: 'Cardiovascular examination, vital signs',
        investigationPlan: 'ECG, cardiac enzymes, chest X-ray',
        finalDiagnosis: 'STEMI (ST-elevation myocardial infarction)',
        managementPlan: 'Immediate PCI, aspirin, clopidogrel, heparin',
        completedAt: new Date('2024-01-15T10:30:00Z'),
        savedAt: new Date('2024-01-15T11:00:00Z'),
        isCompleted: true,
        patientProfileId: patientProfile.id
      }
    });

    // Add some dummy messages
    await prisma.message.createMany({
      data: [
        {
          caseId: completedCase.id,
          sender: 'system',
          text: 'The patient is here today with the following complaint:\n\n"I have severe chest pain that started 2 hours ago"',
          timestamp: new Date('2024-01-15T10:00:00Z')
        },
        {
          caseId: completedCase.id,
          sender: 'student',
          text: 'What brings you in today?',
          timestamp: new Date('2024-01-15T10:01:00Z')
        },
        {
          caseId: completedCase.id,
          sender: 'patient',
          text: 'I have this terrible chest pain that started about 2 hours ago. It feels like someone is sitting on my chest.',
          timestamp: new Date('2024-01-15T10:01:30Z')
        },
        {
          caseId: completedCase.id,
          sender: 'student',
          text: 'Can you tell me more about the pain? Where exactly is it located?',
          timestamp: new Date('2024-01-15T10:02:00Z')
        },
        {
          caseId: completedCase.id,
          sender: 'patient',
          text: 'It\'s in the center of my chest, and it\'s also going down my left arm. It\'s really intense.',
          timestamp: new Date('2024-01-15T10:02:30Z')
        }
      ]
    });

    // Add dummy feedback
    await prisma.feedback.create({
      data: {
        caseId: completedCase.id,
        diagnosis: 'Acute Myocardial Infarction',
        whatYouDidWell: [
          'Excellent history taking - identified radiation to left arm',
          'Good recognition of cardiac symptoms',
          'Appropriate differential diagnosis'
        ],
        whatCouldBeImproved: [
          'Could have asked about risk factors earlier',
          'Should have checked vital signs immediately'
        ],
        keyLearningPoint: 'Always consider cardiac causes in chest pain with radiation to arm',
        clinicalTip: 'Time is muscle in STEMI - rapid recognition and treatment is crucial'
      }
    });

    console.log('✅ Created dummy completed case for testing');
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