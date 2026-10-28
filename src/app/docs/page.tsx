'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Key, Shield, Sparkles, Check, Copy } from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth: 'Public' | 'Author' | 'Admin' | 'Author/Admin';
  params?: string[];
  body?: string;
  response: string;
}

const ENDPOINTS: Endpoint[] = [
  // Auth
  {
    method: 'POST',
    path: '/api/auth/login',
    description: 'Authenticate author or operations admin. Sets HttpOnly JWT session cookie.',
    auth: 'Public',
    body: JSON.stringify({ email: 'priya.sharma@email.com', password: 'author123' }, null, 2),
    response: '200 OK: { success: true, user: { id, name, role... }, token }',
  },
  {
    method: 'POST',
    path: '/api/auth/logout',
    description: 'Clear session cookie and invalidate active browser session.',
    auth: 'Public',
    response: '200 OK: { success: true, message: "Logged out successfully" }',
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    description: 'Get current authenticated user profile and role.',
    auth: 'Author/Admin',
    response: '200 OK: { success: true, user: { id, name, email, role } }',
  },
  {
    method: 'GET',
    path: '/api/auth/demo-users',
    description: 'Returns pre-seeded demo authors and admin accounts for quick switching in evaluation.',
    auth: 'Public',
    response: '200 OK: { success: true, users: [...], defaultCredentialsNote: "..." }',
  },

  // Author
  {
    method: 'GET',
    path: '/api/author/books',
    description: 'Fetch all published & in-production books for the logged-in author with royalty metrics.',
    auth: 'Author',
    response: '200 OK: { success: true, books: [...], summary: { totalCopiesSold, totalRoyaltyEarned... } }',
  },
  {
    method: 'GET',
    path: '/api/author/tickets',
    description: 'List all support queries submitted by the logged-in author with real-time status.',
    auth: 'Author',
    response: '200 OK: { success: true, tickets: [...] }',
  },
  {
    method: 'POST',
    path: '/api/author/tickets',
    description:
      'Submit a new support ticket. Automatically triggers AI auto-classification, priority scoring, and Knowledge Base draft generation.',
    auth: 'Author',
    body: JSON.stringify(
      {
        subject: 'Royalty payout inquiry',
        description: 'When will the pending ₹3,570 be transferred to my bank?',
        bookId: 'BK001',
        attachmentName: 'screenshot.png',
      },
      null,
      2
    ),
    response: '201 Created: { success: true, ticket: { id, ticketNumber, category, priority, aiDraft... } }',
  },
  {
    method: 'GET',
    path: '/api/author/tickets/{id}',
    description: 'Retrieve ticket thread, replies, and status. Enforces author ownership.',
    auth: 'Author',
    params: ['id: Ticket ID (UUID)'],
    response: '200 OK: { success: true, ticket: { ... } }',
  },
  {
    method: 'POST',
    path: '/api/author/tickets/{id}/reply',
    description: 'Post author message to an existing ticket. Dispatches real-time SSE event.',
    auth: 'Author',
    params: ['id: Ticket ID (UUID)'],
    body: JSON.stringify({ content: 'Here are the bank details for verification.' }, null, 2),
    response: '200 OK: { success: true, message: { id, content... } }',
  },

  // Admin
  {
    method: 'GET',
    path: '/api/admin/tickets',
    description: 'List and filter incoming tickets across all authors. Supports sorting by urgent & oldest.',
    auth: 'Admin',
    params: [
      'status: ALL | OPEN | IN_PROGRESS | RESOLVED | CLOSED',
      'category: ALL | ROYALTY_PAYMENTS | ISBN_METADATA | PRINTING_QUALITY...',
      'priority: ALL | CRITICAL | HIGH | MEDIUM | LOW',
      'search: string (author name, email, book title, query)',
      'sortBy: urgent_oldest | newest | oldest',
    ],
    response: '200 OK: { success: true, total: 3, tickets: [...] }',
  },
  {
    method: 'GET',
    path: '/api/admin/tickets/{id}',
    description: 'Full ticket detail with author profile, books catalog, messages, internal notes, AI draft.',
    auth: 'Admin',
    params: ['id: Ticket ID (UUID)'],
    response: '200 OK: { success: true, ticket: { ... } }',
  },
  {
    method: 'PATCH',
    path: '/api/admin/tickets/{id}',
    description: 'Update ticket status, assign admin, or override AI-assigned category and priority.',
    auth: 'Admin',
    params: ['id: Ticket ID (UUID)'],
    body: JSON.stringify(
      {
        status: 'RESOLVED',
        category: 'ROYALTY_PAYMENTS',
        priority: 'HIGH',
        assignedToId: 'SELF',
      },
      null,
      2
    ),
    response: '200 OK: { success: true, ticket: { ... } }',
  },
  {
    method: 'POST',
    path: '/api/admin/tickets/{id}/reply',
    description: 'Dispatch official admin response (AI-draft assisted or custom). Pushed to author via SSE.',
    auth: 'Admin',
    params: ['id: Ticket ID (UUID)'],
    body: JSON.stringify(
      {
        content: 'Dear author, your royalty payment of ₹3,570 has been queued for disbursement.',
        isAiAssisted: true,
        updateStatusTo: 'RESOLVED',
      },
      null,
      2
    ),
    response: '200 OK: { success: true, message: { ... }, ticket: { ... } }',
  },
  {
    method: 'POST',
    path: '/api/admin/tickets/{id}/notes',
    description: 'Add an internal note visible ONLY to operations team members (never to authors).',
    auth: 'Admin',
    params: ['id: Ticket ID (UUID)'],
    body: JSON.stringify({ content: 'Spoke with printer. Reprint batch approved.' }, null, 2),
    response: '200 OK: { success: true, note: { id, content, createdAt... } }',
  },
  {
    method: 'POST',
    path: '/api/admin/tickets/{id}/regenerate-ai',
    description: 'Regenerate AI draft response on demand incorporating newest thread context.',
    auth: 'Admin',
    params: ['id: Ticket ID (UUID)'],
    response: '200 OK: { success: true, aiDraft: "...", aiModelUsed: "gemini-1.5-flash" }',
  },
  {
    method: 'GET',
    path: '/api/admin/stats',
    description: 'Operational queue metrics, active tickets, SLA counts, and category distribution.',
    auth: 'Admin',
    response: '200 OK: { success: true, stats: { totalTickets, openTickets, criticalTickets... } }',
  },

  // Realtime
  {
    method: 'GET',
    path: '/api/stream',
    description: 'Server-Sent Events (SSE) streaming endpoint. Pushes real-time ticket creation, replies, and status changes without polling.',
    auth: 'Author/Admin',
    params: ['ticketId: Optional specific ticket ID to listen to'],
    response: 'text/event-stream (Content-Type: text/event-stream)',
  },
  {
    method: 'GET',
    path: '/api/docs',
    description: 'OpenAPI 3.0 raw JSON schema specification for importing into Postman / Swagger.',
    auth: 'Public',
    response: '200 OK: OpenAPI 3.0 JSON Document',
  },
];

export default function ApiDocsPage() {
  const [filter, setFilter] = useState<'ALL' | 'Auth' | 'Author' | 'Admin' | 'Realtime'>('ALL');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const filteredEndpoints = ENDPOINTS.filter((ep) => {
    if (filter === 'ALL') return true;
    if (filter === 'Auth') return ep.path.includes('/auth');
    if (filter === 'Author') return ep.auth === 'Author' || ep.path.includes('/author');
    if (filter === 'Admin') return ep.auth === 'Admin' || ep.path.includes('/admin');
    if (filter === 'Realtime') return ep.path.includes('/stream') || ep.path.includes('/docs');
    return true;
  });

  const handleCopy = (text: string, path: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'POST':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PATCH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                B
              </div>
              <h1 className="text-base font-semibold text-slate-900">BookLeaf REST API Documentation</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              Raw OpenAPI 3.0 Spec
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        {/* Intro Banner */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              Production REST API & Server-Sent Events Spec
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              BookLeaf Author Support & Operations API
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
              All endpoints follow standard RESTful conventions, return structured JSON payloads, and enforce
              role-based access control (RBAC). Real-time communication is enabled via Server-Sent Events (SSE).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="bg-white/10 rounded-lg p-2.5 backdrop-blur-sm border border-white/10">
                <span className="text-slate-400 block">Base URL</span>
                <span className="font-mono font-medium text-white">/api</span>
              </div>
              <div className="bg-white/10 rounded-lg p-2.5 backdrop-blur-sm border border-white/10">
                <span className="text-slate-400 block">Auth Scheme</span>
                <span className="font-medium text-white">HttpOnly JWT / Bearer</span>
              </div>
              <div className="bg-white/10 rounded-lg p-2.5 backdrop-blur-sm border border-white/10">
                <span className="text-slate-400 block">Real-Time</span>
                <span className="font-medium text-white">SSE (Stream API)</span>
              </div>
              <div className="bg-white/10 rounded-lg p-2.5 backdrop-blur-sm border border-white/10">
                <span className="text-slate-400 block">AI Engine</span>
                <span className="font-medium text-white">Gemini 1.5 + Fallback</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {(['ALL', 'Auth', 'Author', 'Admin', 'Realtime'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' ? 'All Endpoints' : `${tab} Routes`}
            </button>
          ))}
          <span className="text-xs text-slate-500 ml-auto font-medium">
            Showing {filteredEndpoints.length} endpoints
          </span>
        </div>

        {/* Endpoints List */}
        <div className="space-y-4">
          {filteredEndpoints.map((ep, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md border font-mono ${getMethodBadge(
                        ep.method
                      )}`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-sm font-semibold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {ep.path}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                        ep.auth === 'Public'
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : ep.auth === 'Admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {ep.auth === 'Public' ? '🔓 Public' : `🔒 ${ep.auth} Required`}
                    </span>
                    <button
                      onClick={() => handleCopy(ep.path, ep.path)}
                      title="Copy Endpoint"
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                    >
                      {copiedPath === ep.path ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-3">{ep.description}</p>

                {ep.params && ep.params.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Parameters
                    </span>
                    <ul className="text-xs text-slate-700 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
                      {ep.params.map((param, pIdx) => (
                        <li key={pIdx}>• {param}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {ep.body && (
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Request Body Example
                    </span>
                    <pre className="text-xs font-mono bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto">
                      {ep.body}
                    </pre>
                  </div>
                )}

                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Response
                  </span>
                  <div className="text-xs font-mono bg-slate-50 text-slate-800 p-2.5 rounded-lg border border-slate-200">
                    {ep.response}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
