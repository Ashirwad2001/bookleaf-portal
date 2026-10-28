import { NextResponse } from 'next/server';

export async function GET() {
  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'BookLeaf Author Support & Communication Portal API',
      version: '1.0.0',
      description:
        'RESTful API for the BookLeaf Publishing author support dashboard and operations portal, powered by Google Gemini AI auto-classification and grounded response drafting.',
      contact: {
        name: 'BookLeaf Engineering Team',
        email: 'dev@bookleaf.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        CookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'bookleaf_token',
          description: 'HttpOnly JWT cookie set on /api/auth/login',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['AUTHOR', 'ADMIN'] },
            city: { type: 'string' },
            phone: { type: 'string' },
          },
        },
        Book: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            isbn: { type: 'string', nullable: true },
            genre: { type: 'string', nullable: true },
            status: { type: 'string' },
            mrp: { type: 'number', nullable: true },
            totalCopiesSold: { type: 'integer' },
            totalRoyaltyEarned: { type: 'number' },
            royaltyPaid: { type: 'number' },
            royaltyPending: { type: 'number' },
            availableOn: { type: 'array', items: { type: 'string' } },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            ticketNumber: { type: 'string' },
            subject: { type: 'string' },
            description: { type: 'string' },
            category: {
              type: 'string',
              enum: [
                'ROYALTY_PAYMENTS',
                'ISBN_METADATA',
                'PRINTING_QUALITY',
                'DISTRIBUTION_AVAILABILITY',
                'BOOK_STATUS_PRODUCTION',
                'GENERAL_INQUIRY',
              ],
            },
            priority: {
              type: 'string',
              enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            },
            status: {
              type: 'string',
              enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
            },
            aiDraft: { type: 'string', nullable: true },
            aiModelUsed: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    paths: {
      '/api/auth/login': {
        post: {
          summary: 'Authenticate author or admin',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Authenticated successfully with token and cookie' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          summary: 'Log out and clear session cookie',
          responses: { 200: { description: 'Logged out' } },
        },
      },
      '/api/auth/me': {
        get: {
          summary: 'Retrieve current authenticated session',
          responses: { 200: { description: 'Session profile' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/api/auth/demo-users': {
        get: {
          summary: 'List pre-seeded demo authors and admin accounts for evaluation',
          responses: { 200: { description: 'List of users with test passwords' } },
        },
      },
      '/api/author/books': {
        get: {
          summary: 'List books and royalty metrics for authenticated author',
          security: [{ CookieAuth: [] }],
          responses: { 200: { description: 'Author catalog with royalties' } },
        },
      },
      '/api/author/tickets': {
        get: {
          summary: 'List support tickets created by authenticated author',
          security: [{ CookieAuth: [] }],
          responses: { 200: { description: 'Tickets list' } },
        },
        post: {
          summary: 'Submit a new support ticket with AI auto-classification and priority scoring',
          security: [{ CookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['subject', 'description'],
                  properties: {
                    subject: { type: 'string' },
                    description: { type: 'string' },
                    bookId: { type: 'string', nullable: true },
                    attachmentName: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Ticket created with AI analysis' } },
        },
      },
      '/api/author/tickets/{id}': {
        get: {
          summary: 'Retrieve full ticket conversation and status for author',
          security: [{ CookieAuth: [] }],
          responses: { 200: { description: 'Ticket details' }, 403: { description: 'Forbidden' } },
        },
      },
      '/api/author/tickets/{id}/reply': {
        post: {
          summary: 'Post an author reply to a ticket',
          security: [{ CookieAuth: [] }],
          responses: { 200: { description: 'Reply posted and broadcast via SSE' } },
        },
      },
      '/api/admin/tickets': {
        get: {
          summary: 'List and filter incoming tickets across all authors',
          security: [{ CookieAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'priority', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'urgent_oldest' } },
          ],
          responses: { 200: { description: 'Filtered ticket queue' } },
        },
      },
      '/api/admin/tickets/{id}': {
        get: {
          summary: 'Admin detailed ticket view with author profile, books, internal notes, AI draft',
          security: [{ CookieAuth: [] }],
          responses: { 200: { description: 'Ticket details' } },
        },
        patch: {
          summary: 'Update ticket status, admin assignment, or override AI category/priority',
          security: [{ CookieAuth: [] }],
          responses: { 200: { description: 'Ticket updated' } },
        },
      },
      '/api/admin/tickets/{id}/reply': {
        post: {
          summary: 'Dispatch official admin response (with AI draft assistance)',
          security: [{ CookieAuth: [] }],
          responses: { 200: { description: 'Reply sent and pushed to author via SSE' } },
        },
      },
      '/api/admin/tickets/{id}/notes': {
        post: {
          summary: 'Add an internal note visible only to admins',
          security: [{ CookieAuth: [] }],
          responses: { 200: { description: 'Internal note added' } },
        },
      },
      '/api/admin/tickets/{id}/regenerate-ai': {
        post: {
          summary: 'Regenerate AI draft response on demand',
          security: [{ CookieAuth: [] }],
          responses: { 200: { description: 'Fresh AI draft response' } },
        },
      },
      '/api/admin/stats': {
        get: {
          summary: 'Operational metrics and queue statistics',
          security: [{ CookieAuth: [] }],
          responses: { 200: { description: 'Stats payload' } },
        },
      },
      '/api/stream': {
        get: {
          summary: 'Server-Sent Events (SSE) stream for real-time ticket updates and notifications',
          security: [{ CookieAuth: [] }],
          responses: { 200: { description: 'text/event-stream' } },
        },
      },
    },
  };

  return NextResponse.json(openApiSpec);
}
