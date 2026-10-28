import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, TicketStatus } from '@prisma/client';
import { sseHub } from '@/lib/sse';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req, [Role.ADMIN]);
  if ('error' in authResult) return authResult.error;

  const { user } = authResult;
  const { id } = await params;

  try {
    const body = await req.json();
    const { content, isAiAssisted, updateStatusTo } = body;

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

    // Create the admin reply message
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: user.userId,
        senderRole: Role.ADMIN,
        content: content.trim(),
        isAiAssisted: Boolean(isAiAssisted),
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

    // Update ticket status (defaults to IN_PROGRESS if OPEN, or custom status like RESOLVED)
    let nextStatus = ticket.status;
    if (updateStatusTo) {
      nextStatus = updateStatusTo as TicketStatus;
    } else if (ticket.status === TicketStatus.OPEN) {
      nextStatus = TicketStatus.IN_PROGRESS;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: nextStatus,
        assignedToId: ticket.assignedToId || user.userId, // auto-assign to responding admin if unassigned
        updatedAt: new Date(),
      },
    });

    // Real-time broadcast: Immediately updates author's screen and admin queue!
    sseHub.broadcastTicketUpdate(id, ticket.authorId, 'ADMIN_REPLIED', {
      ticketId: id,
      message,
      ticketStatus: updatedTicket.status,
    });

    return NextResponse.json({
      success: true,
      message,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Admin reply error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send admin response' },
      { status: 500 }
    );
  }
}
