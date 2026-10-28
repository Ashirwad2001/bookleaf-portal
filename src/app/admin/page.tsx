'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Shield,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Send,
  User,
  BookOpen,
  Radio,
  RefreshCw,
  LogOut,
  Edit3,
  Copy,
  ChevronRight,
  MessageSquare,
  Lock,
  Plus,
  ArrowUpDown,
  FileText,
  UserCheck,
  Check,
  X,
} from 'lucide-react';

interface BookSummary {
  id: string;
  title: string;
  isbn?: string | null;
  status: string;
  mrp?: number | null;
  totalCopiesSold: number;
  totalRoyaltyEarned: number;
  royaltyPaid: number;
  royaltyPending: number;
  lastRoyaltyPayoutDate?: string | null;
}

interface AuthorDetail {
  id: string;
  name: string;
  email: string;
  city?: string | null;
  phone?: string | null;
  books?: BookSummary[];
}

interface Message {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: 'AUTHOR' | 'ADMIN';
  content: string;
  isAiAssisted?: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
}

interface InternalNote {
  id: string;
  content: string;
  createdAt: string;
  admin: {
    id: string;
    name: string;
    email: string;
  };
}

interface Ticket {
  id: string;
  ticketNumber: string;
  authorId: string;
  author: AuthorDetail;
  bookId?: string | null;
  book?: BookSummary | null;
  subject: string;
  description: string;
  category: string;
  categoryOverridden: boolean;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priorityOverridden: boolean;
  priorityReasoning?: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  aiDraft?: string | null;
  aiDraftGeneratedAt?: string | null;
  aiModelUsed?: string | null;
  messages: Message[];
  internalNotes?: InternalNote[];
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalTickets: number;
  activeTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  criticalTickets: number;
  highPriorityTickets: number;
}

export default function AdminPortal() {
  const { user, loading: authLoading, logout, login } = useAuth();
  const router = useRouter();

  // Filters & State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('urgent_oldest');

  // Selected Ticket Workspace
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loadingTicketDetail, setLoadingTicketDetail] = useState(false);

  // Editor states
  const [replyContent, setReplyContent] = useState('');
  const [isAiAssisted, setIsAiAssisted] = useState(true);
  const [statusAfterReply, setStatusAfterReply] = useState('IN_PROGRESS');
  const [sendingReply, setSendingReply] = useState(false);

  // Internal note
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // AI draft regeneration
  const [regeneratingDraft, setRegeneratingDraft] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auth Guard: Admin only
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Fetch Tickets Queue
  const fetchQueue = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('sortBy', sortBy);

      const res = await fetch(`/api/admin/tickets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTickets(data.tickets);
        }
      }
    } catch (e) {
      console.error('Failed to fetch ticket queue:', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter, searchQuery, sortBy]);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  }, []);

  // Fetch Detailed Ticket
  const fetchTicketDetails = useCallback(async (id: string) => {
    setLoadingTicketDetail(true);
    try {
      const res = await fetch(`/api/admin/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSelectedTicket(data.ticket);
          // Pre-populate reply content with AI draft if available
          if (data.ticket.aiDraft) {
            setReplyContent(data.ticket.aiDraft);
            setIsAiAssisted(true);
          } else {
            setReplyContent('');
            setIsAiAssisted(false);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching ticket details:', e);
    } finally {
      setLoadingTicketDetail(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchQueue();
      fetchStats();
    }
  }, [user, fetchQueue, fetchStats]);

  // Handle ticket selection
  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetails(selectedTicketId);
    } else {
      setSelectedTicket(null);
    }
  }, [selectedTicketId, fetchTicketDetails]);

  // Server-Sent Events (SSE) for Admin Queue
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/stream');

      eventSource.addEventListener('CONNECTED', () => {
        setSseConnected(true);
      });

      eventSource.addEventListener('TICKET_CREATED', (e) => {
        const newTicket = JSON.parse(e.data);
        showToast(`⚡ New ticket received: ${newTicket.ticketNumber} (${newTicket.priority})`);
        fetchQueue();
        fetchStats();
      });

      eventSource.addEventListener('NEW_MESSAGE', (e) => {
        const data = JSON.parse(e.data);
        showToast(`💬 Author reply received on ticket #${data.ticketId.slice(0, 8)}`);
        fetchQueue();
        if (selectedTicketId === data.ticketId) {
          fetchTicketDetails(data.ticketId);
        }
      });

      eventSource.addEventListener('TICKET_UPDATED', () => {
        fetchQueue();
        fetchStats();
      });

      eventSource.onerror = () => {
        setSseConnected(false);
      };
    } catch (err) {
      console.error('Admin SSE error:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [user, fetchQueue, fetchStats, selectedTicketId, fetchTicketDetails]);

  // Dispatch Official Reply
  const handleSendReply = async () => {
    if (!selectedTicket || !replyContent.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          isAiAssisted,
          updateStatusTo: statusAfterReply,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Official response dispatched to author!');
        fetchTicketDetails(selectedTicket.id);
        fetchQueue();
        fetchStats();
      } else {
        alert(data.error || 'Failed to dispatch reply');
      }
    } catch (e) {
      console.error('Admin reply error:', e);
    } finally {
      setSendingReply(false);
    }
  };

  // Add Internal Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !noteContent.trim()) return;

    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNoteContent('');
        fetchTicketDetails(selectedTicket.id);
        showToast('Internal note saved (visible to team only)');
      }
    } finally {
      setAddingNote(false);
    }
  };

  // Override Category / Priority / Status
  const handleTicketUpdate = async (patch: {
    category?: string;
    priority?: string;
    status?: string;
    assignedToId?: string;
  }) => {
    if (!selectedTicket) return;

    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchTicketDetails(selectedTicket.id);
        fetchQueue();
        fetchStats();
        showToast('Ticket updated successfully');
      }
    } catch (e) {
      console.error('Update ticket error:', e);
    }
  };

  // Regenerate AI Draft
  const handleRegenerateDraft = async () => {
    if (!selectedTicket) return;

    setRegeneratingDraft(true);
    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/regenerate-ai`, {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReplyContent(data.aiDraft);
        setIsAiAssisted(true);
        fetchTicketDetails(selectedTicket.id);
        showToast('Fresh Knowledge Base draft generated!');
      }
    } finally {
      setRegeneratingDraft(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      case 'IN_PROGRESS':
        return 'bg-sky-100 text-sky-800 border-sky-200 font-semibold';
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold';
      case 'CLOSED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200 font-semibold';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatCategoryName = (cat: string) => {
    switch (cat) {
      case 'ROYALTY_PAYMENTS':
        return 'Royalty & Payments';
      case 'ISBN_METADATA':
        return 'ISBN & Metadata';
      case 'PRINTING_QUALITY':
        return 'Printing & Quality';
      case 'DISTRIBUTION_AVAILABILITY':
        return 'Distribution & Availability';
      case 'BOOK_STATUS_PRODUCTION':
        return 'Book Status & Production';
      case 'GENERAL_INQUIRY':
        return 'General Inquiry';
      default:
        return cat;
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-600">Loading Operations Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            B
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight block leading-tight">
              BookLeaf Operations Portal
            </span>
            <span className="text-[11px] text-slate-400 block">
              AI Support Management • Catalog & Inquiries
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              sseConnected
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                : 'bg-amber-950/60 text-amber-300 border-amber-800/80'
            }`}
          >
            <Radio
              className={`w-3 h-3 ${sseConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`}
            />
            <span className="hidden sm:inline">
              {sseConnected ? 'Real-Time SSE Connected' : 'Connecting stream...'}
            </span>
          </div>

          <Link
            href="/docs"
            className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            API Spec
          </Link>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            {/* Quick Demo Switch to Author */}
            <button
              onClick={async () => {
                await login('priya.sharma@email.com', 'author123');
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Quickly switch to Author Portal view (Priya Sharma)"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Switch to Author View</span>
            </button>

            <span className="text-xs font-semibold text-white">{user.name}</span>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
        {/* Top Metric Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Queue</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{stats.activeTickets}</span>
                <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                  {stats.openTickets} Open
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Unresolved tickets across all categories</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-rose-600" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Urgent & High</span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-600 tracking-tight">
                  {stats.criticalTickets + stats.highPriorityTickets}
                </span>
                <span className="text-xs text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                  {stats.criticalTickets} Critical
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Defect claims, delayed payouts & ISBN audits</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-sky-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</span>
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-sky-600 tracking-tight">{stats.inProgressTickets}</span>
                <span className="text-xs text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-full">
                  Assigned
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Being handled by operations team</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-700 tracking-tight">{stats.resolvedTickets}</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Completed
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Closed within 48-hour SLA</p>
            </div>
          </div>
        )}

        {/* Workspace Layout: Left Queue (Filterable), Right Ticket Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Ticket Queue List (col-span-5) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
            {/* Queue Filters Header */}
            <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">Incoming Support Queue</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                    {tickets.length}
                  </span>
                </div>

                {/* Sort selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
                  title="Sorting order"
                >
                  <option value="urgent_oldest">Sort: Urgent & Oldest Unresolved</option>
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                </select>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by author, subject, ticket #, book..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Status / Category / Priority Filter chips */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] text-slate-700"
                  >
                    <option value="ALL">Status: All</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] text-slate-700"
                  >
                    <option value="ALL">Category: All</option>
                    <option value="ROYALTY_PAYMENTS">Royalty & Payments</option>
                    <option value="ISBN_METADATA">ISBN & Metadata</option>
                    <option value="PRINTING_QUALITY">Printing & Quality</option>
                    <option value="DISTRIBUTION_AVAILABILITY">Distribution</option>
                    <option value="BOOK_STATUS_PRODUCTION">Production</option>
                    <option value="GENERAL_INQUIRY">General</option>
                  </select>
                </div>

                <div>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] text-slate-700"
                  >
                    <option value="ALL">Priority: All</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ticket Queue List */}
            <div className="divide-y divide-slate-100 max-h-[720px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading queue...</div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No tickets matching active filters.
                </div>
              ) : (
                tickets.map((t) => {
                  const isSelected = selectedTicketId === t.id;
                  const isCritical = t.priority === 'CRITICAL';
                  const isHigh = t.priority === 'HIGH';

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`p-4 hover:bg-slate-50 transition-all cursor-pointer border-l-4 relative group ${
                        isSelected
                          ? 'bg-indigo-50/70 border-l-indigo-600 shadow-xs'
                          : isCritical
                          ? 'border-l-rose-500 bg-rose-50/20 hover:bg-rose-50/40'
                          : isHigh
                          ? 'border-l-amber-500 hover:bg-amber-50/20'
                          : 'border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isCritical && (
                            <span className="relative flex h-2 w-2 mr-0.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                          )}
                          <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {t.ticketNumber}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusBadge(
                              t.status
                            )}`}
                          >
                            {t.status.replace('_', ' ')}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md border ${getPriorityBadge(
                              t.priority
                            )}`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(t.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mb-1.5 group-hover:text-indigo-600 transition-colors">
                        {t.subject}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[9px] font-bold flex items-center justify-center">
                            {t.author.name.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-700">{t.author.name}</span>
                        </div>

                        <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-full font-medium">
                          {formatCategoryName(t.category)}
                        </span>
                      </div>

                      {t.book && (
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span className="truncate">Book: {t.book.title}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Active Ticket Workspace (col-span-7) */}
          <div className="lg:col-span-7">
            {!selectedTicketId ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Select a Ticket from the Queue</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click any ticket on the left to inspect author history, verify book financials, view AI classification, and edit the AI-drafted response.
                </p>
              </div>
            ) : loadingTicketDetail || !selectedTicket ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs text-slate-500">Loading ticket workspace...</span>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-5 p-5 sm:p-6">
                {/* Header & Ticket Status Bar */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {selectedTicket.ticketNumber}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                          selectedTicket.status
                        )}`}
                      >
                        {selectedTicket.status.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md border ${getPriorityBadge(
                          selectedTicket.priority
                        )}`}
                      >
                        {selectedTicket.priority} Priority
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900">{selectedTicket.subject}</h2>
                    <span className="text-xs text-slate-500">
                      Opened by <strong>{selectedTicket.author.name}</strong> ({selectedTicket.author.email}) • {selectedTicket.author.city || 'India'}
                    </span>
                  </div>

                  {/* Quick Status and Assignment Controls */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleTicketUpdate({ status: e.target.value })}
                      className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
                    >
                      <option value="OPEN">Status: Open</option>
                      <option value="IN_PROGRESS">Status: In Progress</option>
                      <option value="RESOLVED">Status: Resolved</option>
                      <option value="CLOSED">Status: Closed</option>
                    </select>

                    <button
                      onClick={() => handleTicketUpdate({ assignedToId: 'SELF' })}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                    >
                      {selectedTicket.assignedToId === user.id ? '✓ Assigned to You' : 'Assign to Me'}
                    </button>
                  </div>
                </div>

                {/* AI Assessment & Overrides Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 border border-indigo-500/30 shadow-lg">
                  {/* Ambient Glow */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

                  <div className="relative z-10 space-y-4">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
                        </div>
                        <span className="text-xs font-bold tracking-wide uppercase text-indigo-200">
                          AI Copilot • Policy Classification Engine
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedTicket.aiModelUsed && (
                          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                            {selectedTicket.aiModelUsed}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          Policy Grounded
                        </span>
                      </div>
                    </div>

                    {/* AI Urgency Reasoning */}
                    {selectedTicket.priorityReasoning && (
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-xs">
                        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                          AI Urgency & Policy Analysis
                        </span>
                        <p className="text-slate-200 text-xs leading-relaxed font-sans">
                          {selectedTicket.priorityReasoning}
                        </p>
                      </div>
                    )}

                    {/* Overrides row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/80 flex items-center gap-2">
                        <span className="text-slate-400 text-[11px] font-medium shrink-0">Category:</span>
                        <select
                          value={selectedTicket.category}
                          onChange={(e) => handleTicketUpdate({ category: e.target.value })}
                          className="bg-transparent text-white font-semibold text-xs focus:outline-none flex-1 cursor-pointer"
                        >
                          <option value="ROYALTY_PAYMENTS" className="bg-slate-900 text-white">Royalty & Payments</option>
                          <option value="ISBN_METADATA" className="bg-slate-900 text-white">ISBN & Metadata</option>
                          <option value="PRINTING_QUALITY" className="bg-slate-900 text-white">Printing & Quality</option>
                          <option value="DISTRIBUTION_AVAILABILITY" className="bg-slate-900 text-white">Distribution</option>
                          <option value="BOOK_STATUS_PRODUCTION" className="bg-slate-900 text-white">Production Updates</option>
                          <option value="GENERAL_INQUIRY" className="bg-slate-900 text-white">General Inquiry</option>
                        </select>
                        {selectedTicket.categoryOverridden && (
                          <span className="text-[9px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                            Custom
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/80 flex items-center gap-2">
                        <span className="text-slate-400 text-[11px] font-medium shrink-0">Priority:</span>
                        <select
                          value={selectedTicket.priority}
                          onChange={(e) => handleTicketUpdate({ priority: e.target.value })}
                          className="bg-transparent text-white font-semibold text-xs focus:outline-none flex-1 cursor-pointer"
                        >
                          <option value="CRITICAL" className="bg-slate-900 text-white">Critical</option>
                          <option value="HIGH" className="bg-slate-900 text-white">High</option>
                          <option value="MEDIUM" className="bg-slate-900 text-white">Medium</option>
                          <option value="LOW" className="bg-slate-900 text-white">Low</option>
                        </select>
                        {selectedTicket.priorityOverridden && (
                          <span className="text-[9px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Author Catalog / Financial Context Drawer */}
                {selectedTicket.author.books && selectedTicket.author.books.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-700 block mb-1.5">
                      Author&apos;s Book Catalog Context ({selectedTicket.author.books.length} titles)
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {selectedTicket.author.books.map((b) => (
                        <div
                          key={b.id}
                          className={`p-2 rounded bg-white border flex items-center justify-between gap-2 ${
                            selectedTicket.bookId === b.id
                              ? 'border-indigo-400 bg-indigo-50/20'
                              : 'border-slate-200'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{b.title}</span>
                            <span className="text-[10px] text-slate-500">
                              Status: {b.status} • Sold: {b.totalCopiesSold} • Pending: ₹{b.royaltyPending}
                            </span>
                          </div>
                          {selectedTicket.bookId === b.id && (
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                              Current Ticket Focus
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversation Thread */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                    Query Conversation History ({selectedTicket.messages.length})
                  </h3>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {selectedTicket.messages.map((m) => {
                      const isAdmin = m.senderRole === 'ADMIN';

                      return (
                        <div
                          key={m.id}
                          className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                            isAdmin
                              ? 'bg-indigo-50/80 border border-indigo-200/70 text-slate-900 ml-4'
                              : 'bg-slate-100 border border-slate-200 text-slate-800 mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-slate-700">
                            <span>
                              {isAdmin ? '🛡️ BookLeaf Operations Response' : `✍️ ${selectedTicket.author.name}`}
                            </span>
                            <span className="text-slate-400 font-normal">
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="whitespace-pre-wrap">{m.content}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Draft Response & Admin Composer */}
                <div className="border border-indigo-200/80 rounded-2xl p-5 bg-gradient-to-b from-indigo-50/40 to-white shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      BookLeaf AI Drafted Response (Editable before dispatch)
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedTicket.aiDraft && replyContent !== selectedTicket.aiDraft && (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyContent(selectedTicket.aiDraft || '');
                            setIsAiAssisted(true);
                            showToast('Restored original AI draft');
                          }}
                          className="text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer border border-indigo-200"
                        >
                          Restore AI Draft
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleRegenerateDraft}
                        disabled={regeneratingDraft}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold disabled:opacity-50 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs"
                      >
                        <RefreshCw className={`w-3 h-3 ${regeneratingDraft ? 'animate-spin' : ''}`} />
                        Regenerate
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-3">
                    Review and customize this response. Once sent, the author will immediately see it in real-time via Server-Sent Events.
                  </p>

                  {/* 1-Click Policy Presets */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center mr-1">
                      Quick Inserts:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyContent((prev) =>
                          `${prev ? prev + '\n\n' : ''}BookLeaf Policy Note: Author royalties are disbursed on the 15th of each month following a 45-day sales verification cycle. If your pending balance is under ₹1,000, it safely rolls over to the next quarter.`
                        );
                      }}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                    >
                      💰 Royalty Cycle (45-Day)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyContent((prev) =>
                          `${prev ? prev + '\n\n' : ''}BookLeaf Quality Guarantee: We have initiated a 100% free reprint batch with our printing partner. A replacement order tracking number will be generated and dispatched within 3 business days.`
                        );
                      }}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                    >
                      📦 Free Reprint Approval
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyContent((prev) =>
                          `${prev ? prev + '\n\n' : ''}Distribution Resync: We have triggered an automated ONIX feed refresh with Amazon India and Flipkart. Availability will reflect within 24 to 48 hours.`
                        );
                      }}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                    >
                      🛒 Distributor Feed Resync
                    </button>
                  </div>

                  <textarea
                    rows={7}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3 shadow-inner leading-relaxed"
                    placeholder="Write or refine the response to the author..."
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAiAssisted}
                          onChange={(e) => setIsAiAssisted(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Flag as Knowledge Base assisted</span>
                      </label>

                      <select
                        value={statusAfterReply}
                        onChange={(e) => setStatusAfterReply(e.target.value)}
                        className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
                      >
                        <option value="IN_PROGRESS">Keep: In Progress</option>
                        <option value="RESOLVED">Mark as: Resolved</option>
                        <option value="CLOSED">Mark as: Closed</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyContent.trim()}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {sendingReply ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Send Official Response
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Internal Ops Team Notes (Private, invisible to author) */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    Internal Notes (Ops Team Only — Never shown to author)
                  </div>

                  {selectedTicket.internalNotes && selectedTicket.internalNotes.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {selectedTicket.internalNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-semibold text-slate-700">
                              {note.admin.name} ({note.admin.email})
                            </span>
                            <span>{new Date(note.createdAt).toLocaleString()}</span>
                          </div>
                          <div>{note.content}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mb-3 italic">
                      No internal notes recorded yet.
                    </p>
                  )}

                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add an internal note (e.g. 'Reprint batch sent to Repro India', 'Checked bank ref')..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={addingNote || !noteContent.trim()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {addingNote ? 'Adding...' : 'Add Note'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
