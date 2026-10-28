import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, TicketStatus, Priority } from '@prisma/client';

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req, [Role.ADMIN]);
  if ('error' in authResult) return authResult.error;

  try {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      criticalTickets,
      highPriorityTickets,
      categoryGroups,
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: TicketStatus.OPEN } }),
      prisma.ticket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      prisma.ticket.count({ where: { status: TicketStatus.RESOLVED } }),
      prisma.ticket.count({
        where: {
          priority: Priority.CRITICAL,
          status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] },
        },
      }),
      prisma.ticket.count({
        where: {
          priority: Priority.HIGH,
          status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] },
        },
      }),
      prisma.ticket.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
    ]);

    const activeTickets = openTickets + inProgressTickets;

    return NextResponse.json({
      success: true,
      stats: {
        totalTickets,
        activeTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        criticalTickets,
        highPriorityTickets,
        categories: categoryGroups.map((cg) => ({
          category: cg.category,
          count: cg._count.id,
        })),
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch queue statistics' },
      { status: 500 }
    );
  }
}
