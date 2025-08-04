import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count()
    const caseCount = await prisma.case.count()
    const departmentCount = await prisma.department.count()
    
    // Get some sample data
    const departments = await prisma.department.findMany({
      take: 5
    })
    
    const recentCases = await prisma.case.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true } },
        department: { select: { name: true } }
      }
    })
    
    return NextResponse.json({
      success: true,
      connection: 'OK',
      counts: {
        users: userCount,
        cases: caseCount,
        departments: departmentCount
      },
      sampleData: {
        departments,
        recentCases
      }
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      connection: 'FAILED'
    }, { status: 500 })
  }
} 