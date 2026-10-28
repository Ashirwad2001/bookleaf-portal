/**
 * In-memory Real-time PubSub Event Hub for Server-Sent Events (SSE)
 * Allows author and admin portals to receive instant updates without refreshing.
 */

type ListenerCallback = (data: { event: string; payload: unknown }) => void;

class RealtimeHub {
  private listeners: Map<string, Set<ListenerCallback>> = new Map();

  /**
   * Subscribe to events for a specific channel (e.g., "author:AUTH001", "ticket:TKT-1001", "admin:queue")
   */
  subscribe(channel: string, callback: ListenerCallback): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      const channelSet = this.listeners.get(channel);
      if (channelSet) {
        channelSet.delete(callback);
        if (channelSet.size === 0) {
          this.listeners.delete(channel);
        }
      }
    };
  }

  /**
   * Publish an event to a channel
   */
  publish(channel: string, event: string, payload: unknown) {
    const channelSet = this.listeners.get(channel);
    if (channelSet) {
      channelSet.forEach((cb) => {
        try {
          cb({ event, payload });
        } catch (e) {
          console.error('[SSE Hub Error] Error delivering message to listener:', e);
        }
      });
    }
  }

  /**
   * Broadcast an update across author, ticket, and admin channels
   */
  broadcastTicketUpdate(ticketId: string, authorId: string, eventName: string, data: unknown) {
    // 1. Channel for the specific ticket conversation
    this.publish(`ticket:${ticketId}`, eventName, data);
    // 2. Channel for the specific author's ticket list
    this.publish(`author:${authorId}`, eventName, data);
    // 3. Channel for the admin queue
    this.publish('admin:queue', eventName, data);
  }
}

// Global singleton instance
const globalForSSE = globalThis as unknown as {
  sseHub: RealtimeHub | undefined;
};

export const sseHub = globalForSSE.sseHub ?? new RealtimeHub();

if (process.env.NODE_ENV !== 'production') {
  globalForSSE.sseHub = sseHub;
}
