import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
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
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Internal note content cannot be empty' },
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

    const note = await prisma.internalNote.create({
      data: {
        ticketId: id,
        adminId: user.userId,
        content: content.trim(),
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Notify other admins on this ticket channel
    sseHub.publish(`ticket:${id}`, 'NOTE_ADDED', note);

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error('Add internal note error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add internal note' },
      { status: 500 }
    );
  }
}
