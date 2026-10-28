import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { sseHub } from '@/lib/sse';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get('ticketId');

  const encoder = new TextEncoder();
  const unsubs: (() => void)[] = [];

  const stream = new ReadableStream({
    start(controller) {
      // Helper to enqueue formatted SSE data
      const sendEvent = (event: string, data: unknown) => {
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (e) {
          console.error('[SSE Stream Error] Failed to enqueue event:', e);
        }
      };

      // Send initial connected confirmation
      sendEvent('CONNECTED', {
        userId: user.userId,
        role: user.role,
        timestamp: new Date().toISOString(),
      });

      // 1. Channel subscription for author
      if (user.role === Role.AUTHOR) {
        const unsubAuthor = sseHub.subscribe(`author:${user.userId}`, ({ event, payload }) => {
          sendEvent(event, payload);
        });
        unsubs.push(unsubAuthor);
      }

      // 2. Channel subscription for admin queue
      if (user.role === Role.ADMIN) {
        const unsubAdmin = sseHub.subscribe('admin:queue', ({ event, payload }) => {
          sendEvent(event, payload);
        });
        unsubs.push(unsubAdmin);
      }

      // 3. Ticket specific channel
      if (ticketId) {
        const unsubTicket = sseHub.subscribe(`ticket:${ticketId}`, ({ event, payload }) => {
          sendEvent(event, payload);
        });
        unsubs.push(unsubTicket);
      }

      // Heartbeat ping every 25 seconds to keep connection alive through proxies
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 25000);

      // Clean up on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        unsubs.forEach((unsub) => unsub());
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      unsubs.forEach((unsub) => unsub());
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform, no-store, must-revalidate',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
