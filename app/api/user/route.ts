import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../lib/auth';
import { prisma } from '../../../lib/database/prisma';

/**
 * PATCH /api/user - Update user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get user session with proper typing
    const session = await getServerSession(auth) as { user?: { email?: string; name?: string; image?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to continue.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { country } = body;

    // Validate request
    if (!country || typeof country !== 'string' || country.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Valid country is required' },
        { status: 400 }
      );
    }

    const trimmedCountry = country.trim();

    // Get or create user in database (robust user handling)
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: { country: trimmedCountry },
      create: {
        email: session.user.email,
        country: trimmedCountry,
        name: session.user.name || undefined,
        image: session.user.image || undefined,
      },
      select: {
        id: true,
        email: true,
        country: true,
        name: true,
        updatedAt: true
      }
    });

    console.log(`✅ Updated user country: ${user.email} -> ${trimmedCountry}`);

    return NextResponse.json({
      success: true,
      user: user,
      message: `Country successfully set to ${trimmedCountry}`
    });

  } catch (error) {
    console.error('💥 User country update error:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { success: false, error: 'User account conflict. Please try again.' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update country. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user - Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    // Get user session with proper typing
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to continue.' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        country: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
