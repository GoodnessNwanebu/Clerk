const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test user creation
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });
    
    console.log('✅ User creation successful:', testUser);
    
    // Test user retrieval
    const users = await prisma.user.findMany();
    console.log('✅ Users in database:', users.length);
    
    // Clean up test user
    await prisma.user.delete({
      where: { email: 'test@example.com' },
    });
    console.log('✅ Test user cleaned up');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
