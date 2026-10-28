import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        city: true,
        books: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: [{ role: 'desc' }, { id: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      users,
      defaultCredentialsNote:
        'All seeded author accounts use password: "author123". The admin account uses: "admin123".',
    });
  } catch (error) {
    console.error('Demo users error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch demo users' },
      { status: 500 }
    );
  }
}
