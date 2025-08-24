import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create main departments and their subspecialties
  const departmentData = [
    {
      name: 'Obstetrics',
      subspecialties: []
    },
    {
      name: 'Gynecology',
      subspecialties: []
    },
    {
      name: 'Pediatrics',
      subspecialties: [
        'Neonatology',
        'Pediatric Cardiology',
        'Pediatric Endocrinology',
        'Pediatric Neurology',
        'Pediatric Oncology',
        'Pediatric Emergency Medicine',
        'Infectious Diseases',
        'Pediatric Psychiatry',
        'Pediatric Community Medicine',
        'Pediatric Nephrology'
      ]
    },
    {
      name: 'Internal Medicine',
      subspecialties: [
        'Cardiology',
        'Endocrinology',
        'Rheumatology',
        'Neurology',
        'Nephrology',
        'Gastroenterology',
        'Respiratory',
        'Radiology',
        'Dermatology',
        'Psychiatry',
        'Infectious'
      ]
    },
    {
      name: 'Surgery',
      subspecialties: [
        'General Surgery',
        'ENT Surgery',
        'Ophthalmology',
        'Anesthesiology',
        'Orthopedics',
        'Neurosurgery',
        'Plastic Surgery',
        'Urology',
        'Cardiothoracic',
        'Pediatric Surgery'
      ]
    }
  ];

  console.log('📋 Creating departments and subspecialties...');
  for (const deptData of departmentData) {
    // Create the main department
    const department = await prisma.department.upsert({
      where: { name: deptData.name },
      update: {},
      create: {
        name: deptData.name,
      },
    });
    console.log(`✅ Created department: ${department.name}`);

    // Create subspecialties for this department
    for (const subspecialtyName of deptData.subspecialties) {
      const subspecialty = await prisma.subspecialty.upsert({
        where: {
          name_departmentId: {
            name: subspecialtyName,
            departmentId: department.id
          }
        },
        update: {},
        create: {
          name: subspecialtyName,
          departmentId: department.id,
        },
      });
      console.log(`  📍 Created subspecialty: ${subspecialty.name}`);
    }
  }

  // Create sample users for testing
  console.log('👥 Creating sample users...');
  const sampleUsers = [
    {
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://via.placeholder.com/150'
    },
    {
      email: 'doctor@example.com',
      name: 'Dr. John Smith',
      image: 'https://via.placeholder.com/150'
    }
  ];

  for (const userData of sampleUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    console.log(`✅ Created user: ${user.name} (${user.email})`);
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
