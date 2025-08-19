const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSession() {
  const sessionId = 'session_1755639369202_yzxem79s1';
  const caseId = 'cmej2cma30001vjt4jlgqx0ku';
  
  console.log('🧪 Testing session:', sessionId);
  console.log('📋 Case ID:', caseId);
  console.log('⏰ Current time:', new Date().toISOString());
  
  try {
    // Check if session exists and is active
    const session = await prisma.caseSession.findFirst({
      where: {
        sessionId: sessionId
      }
    });
    
    if (!session) {
      console.log('❌ Session not found');
      return;
    }
    
    console.log('📊 Session status:');
    console.log('  - Is Active:', session.isActive);
    console.log('  - Expires At:', session.expiresAt.toISOString());
    console.log('  - Case ID:', session.caseId);
    
    // Check case data
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        diagnosis: true,
        finalDiagnosis: true,
        managementPlan: true,
        isCompleted: true
      }
    });
    
    if (caseRecord) {
      console.log('📋 Case data:');
      console.log('  - Original Diagnosis:', caseRecord.diagnosis);
      console.log('  - Final Diagnosis:', caseRecord.finalDiagnosis);
      console.log('  - Management Plan:', caseRecord.managementPlan);
      console.log('  - Is Completed:', caseRecord.isCompleted);
    }
    
    // Reactivate session if needed
    if (!session.isActive) {
      console.log('🔄 Reactivating session...');
      await prisma.caseSession.updateMany({
        where: {
          sessionId: sessionId,
          caseId: caseId
        },
        data: {
          isActive: true,
          expiresAt: new Date(Date.now() + 3600 * 1000) // Extend by 1 hour
        }
      });
      console.log('✅ Session reactivated');
    }
    
  } catch (error) {
    console.error('❌ Error testing session:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSession();
