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
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to continue.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { country } = body;

    // Validate request
    if (!country) {
      return NextResponse.json(
        { success: false, error: 'Country is required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user country
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { country },
      select: {
        id: true,
        email: true,
        country: true,
        name: true,
        updatedAt: true
      }
    });

    console.log(`✅ Updated user country: ${user.email} -> ${country}`);

    return NextResponse.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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
