import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { analyzeTicketWithAI } from '@/lib/ai';
import { sseHub } from '@/lib/sse';

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req, [Role.AUTHOR, Role.ADMIN]);
  if ('error' in authResult) return authResult.error;

  const { user } = authResult;

  try {
    const tickets = await prisma.ticket.findMany({
      where: { authorId: user.userId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    console.error('Fetch author tickets error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve support tickets' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req, [Role.AUTHOR]);
  if ('error' in authResult) return authResult.error;

  const { user } = authResult;

  try {
    const body = await req.json();
    const { subject, description, bookId, attachmentName } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { success: false, error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { success: false, error: 'Detailed description is required' },
        { status: 400 }
      );
    }

    // Verify author exists
    const authorRecord = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!authorRecord) {
      return NextResponse.json(
        { success: false, error: 'Author profile not found' },
        { status: 404 }
      );
    }

    // Verify book if specified
    let bookRecord = null;
    if (bookId && bookId !== 'GENERAL') {
      bookRecord = await prisma.book.findFirst({
        where: { id: bookId, authorId: user.userId },
      });
    }

    // AI Analysis (Classification, Priority, Grounded Draft Response)
    const authorContext = {
      name: authorRecord.name,
      email: authorRecord.email,
    };

    const bookContext = bookRecord
      ? {
          id: bookRecord.id,
          title: bookRecord.title,
          status: bookRecord.status,
          isbn: bookRecord.isbn,
          mrp: bookRecord.mrp,
          totalCopiesSold: bookRecord.totalCopiesSold,
          totalRoyaltyEarned: bookRecord.totalRoyaltyEarned,
          royaltyPaid: bookRecord.royaltyPaid,
          royaltyPending: bookRecord.royaltyPending,
          lastRoyaltyPayoutDate: bookRecord.lastRoyaltyPayoutDate,
          printPartner: bookRecord.printPartner,
        }
      : null;

    const aiResult = await analyzeTicketWithAI(
      subject.trim(),
      description.trim(),
      authorContext,
      bookContext
    );

    // Generate unique sequential ticket number
    const count = await prisma.ticket.count();
    const ticketNumber = `TKT-${1000 + count + 1}`;

    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber,
        authorId: user.userId,
        bookId: bookRecord ? bookRecord.id : null,
        subject: subject.trim(),
        description: description.trim(),
        category: aiResult.category,
        priority: aiResult.priority,
        priorityReasoning: aiResult.priorityReasoning,
        aiDraft: aiResult.draftResponse,
        aiDraftGeneratedAt: new Date(),
        aiModelUsed: aiResult.engineUsed,
        attachmentName: attachmentName?.trim() || null,
        messages: {
          create: [
            {
              senderId: user.userId,
              senderRole: Role.AUTHOR,
              content: description.trim(),
            },
          ],
        },
      },
      include: {
        book: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Broadcast SSE update so admin queue immediately reflects the new ticket!
    sseHub.broadcastTicketUpdate(
      newTicket.id,
      user.userId,
      'TICKET_CREATED',
      newTicket
    );

    return NextResponse.json(
      {
        success: true,
        ticket: newTicket,
        aiAnalysis: {
          category: aiResult.category,
          priority: aiResult.priority,
          reasoning: aiResult.priorityReasoning,
          engineUsed: aiResult.engineUsed,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error creating ticket' },
      { status: 500 }
    );
  }
}
