import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { analyzeTicketWithAI } from '@/lib/ai';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req, [Role.ADMIN]);
  if ('error' in authResult) return authResult.error;

  const { id } = await params;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        author: true,
        book: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Build context with latest messages
    const latestQuery =
      ticket.messages
        .filter((m) => m.senderRole === Role.AUTHOR)
        .map((m) => m.content)
        .join('\n\n---\n\n') || ticket.description;

    const authorContext = {
      name: ticket.author.name,
      email: ticket.author.email,
    };

    const bookContext = ticket.book
      ? {
          id: ticket.book.id,
          title: ticket.book.title,
          status: ticket.book.status,
          isbn: ticket.book.isbn,
          mrp: ticket.book.mrp,
          totalCopiesSold: ticket.book.totalCopiesSold,
          totalRoyaltyEarned: ticket.book.totalRoyaltyEarned,
          royaltyPaid: ticket.book.royaltyPaid,
          royaltyPending: ticket.book.royaltyPending,
          lastRoyaltyPayoutDate: ticket.book.lastRoyaltyPayoutDate,
          printPartner: ticket.book.printPartner,
        }
      : null;

    const aiResult = await analyzeTicketWithAI(
      ticket.subject,
      latestQuery,
      authorContext,
      bookContext
    );

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        aiDraft: aiResult.draftResponse,
        aiDraftGeneratedAt: new Date(),
        aiModelUsed: aiResult.engineUsed,
      },
    });

    return NextResponse.json({
      success: true,
      aiDraft: updated.aiDraft,
      aiModelUsed: updated.aiModelUsed,
      aiDraftGeneratedAt: updated.aiDraftGeneratedAt,
    });
  } catch (error) {
    console.error('Regenerate AI draft error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to regenerate AI draft response' },
      { status: 500 }
    );
  }
}
