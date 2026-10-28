import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, TicketStatus, TicketCategory, Priority } from '@prisma/client';
import { sseHub } from '@/lib/sse';

export async function GET(
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
        author: {
          include: {
            books: {
              select: {
                id: true,
                title: true,
                isbn: true,
                status: true,
                mrp: true,
                totalCopiesSold: true,
                totalRoyaltyEarned: true,
                royaltyPaid: true,
                royaltyPending: true,
                lastRoyaltyPayoutDate: true,
              },
            },
          },
        },
        book: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        internalNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Admin ticket detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve ticket details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req, [Role.ADMIN]);
  if ('error' in authResult) return authResult.error;

  const { user } = authResult;
  const { id } = await params;

  try {
    const body = await req.json();
    const { status, category, priority, assignedToId } = body;

    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Build update payload
    const updateData: {
      status?: TicketStatus;
      category?: TicketCategory;
      categoryOverridden?: boolean;
      priority?: Priority;
      priorityOverridden?: boolean;
      assignedToId?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status as TicketStatus;
    }

    if (category) {
      updateData.category = category as TicketCategory;
      if (category !== existingTicket.category) {
        updateData.categoryOverridden = true;
      }
    }

    if (priority) {
      updateData.priority = priority as Priority;
      if (priority !== existingTicket.priority) {
        updateData.priorityOverridden = true;
      }
    }

    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId === 'SELF' ? user.userId : assignedToId;
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Real-time broadcast
    sseHub.broadcastTicketUpdate(id, existingTicket.authorId, 'TICKET_UPDATED', updated);

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error) {
    console.error('Admin ticket update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
