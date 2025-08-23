import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/database/prisma';

// Cache headers for static data
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', // 1 hour cache, 24 hour stale-while-revalidate
};

export async function GET(request: NextRequest) {
  try {
    // Fetch all departments with their subspecialties
    const departments = await prisma.department.findMany({
      include: {
        subspecialties: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform the data to match the frontend structure
    const transformedDepartments = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      subspecialties: dept.subspecialties.map(sub => ({
        id: sub.id,
        name: sub.name,
      })),
    }));

    return NextResponse.json({
      success: true,
      departments: transformedDepartments,
    }, {
      headers: CACHE_HEADERS
    });

  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}
