import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req, [Role.AUTHOR, Role.ADMIN]);
  if ('error' in authResult) return authResult.error;

  const { user } = authResult;
  const { id } = await params;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
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
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Role-based access control: Authors can only view their own tickets
    if (user.role === Role.AUTHOR && ticket.authorId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You cannot access tickets from another author' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Get author ticket error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve ticket' },
      { status: 500 }
    );
  }
}
