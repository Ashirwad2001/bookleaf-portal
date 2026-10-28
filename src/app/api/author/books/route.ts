import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req, [Role.AUTHOR, Role.ADMIN]);
  if ('error' in authResult) return authResult.error;

  const { user } = authResult;

  try {
    const books = await prisma.book.findMany({
      where: { authorId: user.userId },
      orderBy: { createdAt: 'desc' },
    });

    const parsedBooks = books.map((b) => ({
      ...b,
      availableOn: JSON.parse(b.availableOnJson || '[]'),
      isBelowThreshold: b.royaltyPending > 0 && b.royaltyPending < 1000,
    }));

    // Author aggregate summary stats
    const totalCopiesSold = books.reduce((sum, b) => sum + (b.totalCopiesSold || 0), 0);
    const totalRoyaltyEarned = books.reduce((sum, b) => sum + (b.totalRoyaltyEarned || 0), 0);
    const totalRoyaltyPaid = books.reduce((sum, b) => sum + (b.royaltyPaid || 0), 0);
    const totalRoyaltyPending = books.reduce((sum, b) => sum + (b.royaltyPending || 0), 0);

    return NextResponse.json({
      success: true,
      books: parsedBooks,
      summary: {
        totalBooks: books.length,
        totalCopiesSold,
        totalRoyaltyEarned,
        totalRoyaltyPaid,
        totalRoyaltyPending,
      },
    });
  } catch (error) {
    console.error('Fetch author books error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve published books' },
      { status: 500 }
    );
  }
}
