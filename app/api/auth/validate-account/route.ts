import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/database/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(auth) as { user?: { email?: string; name?: string; image?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email } = body;

    // Validate that the email matches the session
    if (email !== session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Email mismatch' },
        { status: 403 }
      );
    }

    // Check if user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!dbUser) {
      console.log('⚠️ User logged in but no account found, creating account...');
      
      try {
        // Try to create the user account
        dbUser = await prisma.user.create({
          data: {
            email: email,
            name: session.user.name || undefined,
            image: session.user.image || undefined,
          },
        });
        console.log('✅ Account created for logged-in user:', dbUser);
      } catch (error) {
        console.error('❌ Error creating user account:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create account' },
          { status: 500 }
        );
      }
    } else {
      console.log('✅ User account found:', dbUser);
    }

    return NextResponse.json({
      success: true,
      userId: dbUser.id,
      message: 'Account validated successfully'
    });

  } catch (error) {
    console.error('Error validating account:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
