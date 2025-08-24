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

    // Sort departments: Ob Gyn first, then departments with subspecialties, then others, with Dentistry last
    const sortedDepartments = transformedDepartments.sort((a, b) => {
      // Special case: Dentistry should always be last
      if (a.name === 'Dentistry') return 1;
      if (b.name === 'Dentistry') return -1;
      
      // Special case: Obstetrics and Gynecology should be first
      if (a.name === 'Obstetrics' || a.name === 'Gynecology') return -1;
      if (b.name === 'Obstetrics' || b.name === 'Gynecology') return 1;
      
      const aHasSubspecialties = a.subspecialties.length > 0;
      const bHasSubspecialties = b.subspecialties.length > 0;
      
      // If one has subspecialties and the other doesn't, put the one with subspecialties first
      if (aHasSubspecialties !== bHasSubspecialties) {
        return aHasSubspecialties ? -1 : 1;
      }
      
      // If both have the same subspecialty status, sort alphabetically
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      departments: sortedDepartments,
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
