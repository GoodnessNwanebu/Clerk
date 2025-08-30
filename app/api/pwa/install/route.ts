import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/database/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { installSource = 'manual' } = body;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user with PWA installation data
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        pwaInstalledAt: new Date(),
        pwaInstallSource: installSource
      }
    });

    return NextResponse.json({
      success: true,
      message: 'PWA installation tracked successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        pwaInstalledAt: updatedUser.pwaInstalledAt,
        pwaInstallSource: updatedUser.pwaInstallSource
      }
    });

  } catch (error) {
    console.error('Error tracking PWA installation:', error);
    return NextResponse.json(
      { error: 'Failed to track PWA installation' },
      { status: 500 }
    );
  }
}
