import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, TicketStatus } from '@prisma/client';
import { sseHub } from '@/lib/sse';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req, [Role.AUTHOR]);
  if ('error' in authResult) return authResult.error;

  const { user } = authResult;
  const { id } = await params;

  try {
    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Reply content cannot be empty' },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    if (ticket.authorId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You cannot reply to another author\'s ticket' },
        { status: 403 }
      );
    }

    // Create the message and update ticket status
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: user.userId,
        senderRole: Role.AUTHOR,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // If ticket was closed or resolved, reopen it to IN_PROGRESS
    const updatedStatus =
      ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED
        ? TicketStatus.IN_PROGRESS
        : ticket.status;

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: updatedStatus,
        updatedAt: new Date(),
      },
    });

    // Real-time broadcast
    sseHub.broadcastTicketUpdate(id, user.userId, 'NEW_MESSAGE', {
      ticketId: id,
      message,
      ticketStatus: updatedTicket.status,
    });

    return NextResponse.json({ success: true, message, ticket: updatedTicket });
  } catch (error) {
    console.error('Author reply error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send reply' },
      { status: 500 }
    );
  }
}
