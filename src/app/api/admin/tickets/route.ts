import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, TicketStatus, TicketCategory, Priority, Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req, [Role.ADMIN]);
  if ('error' in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');
  const categoryParam = searchParams.get('category');
  const priorityParam = searchParams.get('priority');
  const searchParam = searchParams.get('search');
  const sortByParam = searchParams.get('sortBy') || 'urgent_oldest';

  try {
    const where: Prisma.TicketWhereInput = {};

    if (statusParam && statusParam !== 'ALL') {
      where.status = statusParam as TicketStatus;
    }

    if (categoryParam && categoryParam !== 'ALL') {
      where.category = categoryParam as TicketCategory;
    }

    if (priorityParam && priorityParam !== 'ALL') {
      where.priority = priorityParam as Priority;
    }

    if (searchParam && searchParam.trim()) {
      const q = searchParam.trim();
      where.OR = [
        { ticketNumber: { contains: q } },
        { subject: { contains: q } },
        { description: { contains: q } },
        { author: { name: { contains: q } } },
        { author: { email: { contains: q } } },
        { book: { title: { contains: q } } },
      ];
    }

    let tickets = await prisma.ticket.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            city: true,
            phone: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
            status: true,
            mrp: true,
            totalCopiesSold: true,
            royaltyPending: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
            internalNotes: true,
          },
        },
      },
    });

    // Custom sorting: "urgent_oldest" prioritizes Critical > High > Medium > Low,
    // and within unresolved statuses (OPEN, IN_PROGRESS), sorts by oldest createdAt
    if (sortByParam === 'urgent_oldest') {
      const priorityWeight: Record<Priority, number> = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };

      const statusWeight: Record<TicketStatus, number> = {
        OPEN: 3,
        IN_PROGRESS: 2,
        RESOLVED: 1,
        CLOSED: 0,
      };

      tickets.sort((a, b) => {
        // First by unresolved status
        const statusDiff = statusWeight[b.status] - statusWeight[a.status];
        if (statusDiff !== 0) return statusDiff;

        // Then by priority score
        const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then oldest first
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    } else if (sortByParam === 'oldest') {
      tickets.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      // Default: newest first
      tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return NextResponse.json({
      success: true,
      total: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error('Admin ticket queue error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve ticket queue' },
      { status: 500 }
    );
  }
}
