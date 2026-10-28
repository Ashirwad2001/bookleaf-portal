'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  Send,
  MessageSquare,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Paperclip,
  LogOut,
  RefreshCw,
  Radio,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Sparkles,
  User,
  Shield,
  ShieldAlert,
  X,
} from 'lucide-react';

interface Book {
  id: string;
  title: string;
  isbn: string | null;
  genre: string | null;
  publicationDate: string | null;
  status: string;
  mrp: number | null;
  authorRoyaltyPerCopy: number | null;
  totalCopiesSold: number;
  totalRoyaltyEarned: number;
  royaltyPaid: number;
  royaltyPending: number;
  lastRoyaltyPayoutDate: string | null;
  printPartner: string | null;
  availableOn: string[];
  isBelowThreshold?: boolean;
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

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  bookId: string | null;
  book?: {
    id: string;
    title: string;
    status: string;
  } | null;
  messages: Message[];
  attachmentName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AuthorDashboard() {
  const { user, loading: authLoading, logout, login } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'books' | 'tickets' | 'submit'>('books');
  const [books, setBooks] = useState<Book[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [booksSummary, setBooksSummary] = useState<{
    totalBooks: number;
    totalCopiesSold: number;
    totalRoyaltyEarned: number;
    totalRoyaltyPaid: number;
    totalRoyaltyPending: number;
  } | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Form states for submitting new query
  const [formBookId, setFormBookId] = useState('GENERAL');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAttachment, setFormAttachment] = useState<File | null>(null);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [submitSuccessNotice, setSubmitSuccessNotice] = useState<string | null>(null);

  // Toast notifications for real-time events
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Check auth
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Fetch author books
  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch('/api/author/books');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBooks(data.books);
          setBooksSummary(data.summary);
        }
      }
    } catch (e) {
      console.error('Failed to fetch author books:', e);
    }
  }, []);

  // Fetch author tickets
  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/author/tickets');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTickets(data.tickets);
        }
      }
    } catch (e) {
      console.error('Failed to fetch author tickets:', e);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchBooks();
      fetchTickets();
    }
  }, [user, fetchBooks, fetchTickets]);

  // Server-Sent Events (SSE) Real-Time Connection
  useEffect(() => {
    if (!user) return;

    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/stream');

      eventSource.addEventListener('CONNECTED', () => {
        setSseConnected(true);
      });

      eventSource.addEventListener('ADMIN_REPLIED', (e) => {
        const data = JSON.parse(e.data);
        showToast('New official reply received from BookLeaf Operations!');

        // Update tickets list state
        setTickets((prev) =>
          prev.map((t) => {
            if (t.id === data.ticketId) {
              const updatedMessages = [...t.messages, data.message];
              return {
                ...t,
                status: data.ticketStatus || t.status,
                messages: updatedMessages,
              };
            }
            return t;
          })
        );

        // Update open modal if looking at this ticket
        setSelectedTicket((prev) => {
          if (prev && prev.id === data.ticketId) {
            return {
              ...prev,
              status: data.ticketStatus || prev.status,
              messages: [...prev.messages, data.message],
            };
          }
          return prev;
        });
      });

      eventSource.addEventListener('TICKET_UPDATED', (e) => {
        const data = JSON.parse(e.data);
        showToast(`Ticket #${data.ticketNumber || ''} status updated to ${data.status}`);

        setTickets((prev) =>
          prev.map((t) => (t.id === data.id ? { ...t, ...data } : t))
        );

        setSelectedTicket((prev) => (prev && prev.id === data.id ? { ...prev, ...data } : prev));
      });

      eventSource.onerror = () => {
        setSseConnected(false);
      };
    } catch (err) {
      console.error('SSE initialization error:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user]);

  // Submit new ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formDescription.trim()) return;

    setSubmittingTicket(true);
    try {
      const res = await fetch('/api/author/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: formBookId === 'GENERAL' ? null : formBookId,
          subject: formSubject,
          description: formDescription,
          attachmentName: formAttachment ? formAttachment.name : null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitSuccessNotice(
          `Ticket ${data.ticket.ticketNumber} created! AI auto-classified as "${data.ticket.category}" (${data.ticket.priority} Priority).`
        );
        setFormSubject('');
        setFormDescription('');
        setFormAttachment(null);
        setFormBookId('GENERAL');
        fetchTickets();
        setActiveTab('tickets');
        showToast(`Ticket ${data.ticket.ticketNumber} submitted successfully!`);
      } else {
        alert(data.error || 'Failed to submit ticket');
      }
    } catch (e) {
      console.error('Submit ticket error:', e);
      alert('Error submitting query');
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Send author reply
  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/author/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReplyText('');
        // Add message locally
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                status: data.ticket.status,
                messages: [...prev.messages, data.message],
              }
            : null
        );
        fetchTickets();
      } else {
        alert(data.error || 'Failed to post reply');
      }
    } catch (e) {
      console.error('Reply error:', e);
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'IN_PROGRESS':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-600">Loading Author Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Toast Notification Banner */}
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

      {/* Main Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              B
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">
                BookLeaf Publishing
              </span>
              <span className="text-xs text-indigo-600 font-medium block">Author Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Realtime SSE indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                sseConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={sseConnected ? 'Real-time SSE active' : 'Connecting real-time SSE...'}
            >
              <Radio
                className={`w-3 h-3 ${sseConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`}
              />
              <span className="hidden sm:inline">
                {sseConnected ? 'Live Connection Active' : 'Connecting...'}
              </span>
            </div>

            {/* Author Profile Chip */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
                {user.name.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                <span className="text-xs font-semibold text-slate-900 block leading-tight">
                  {user.name}
                </span>
                <span className="text-[11px] text-slate-500 block">{user.email}</span>
              </div>
            </div>

            {/* Quick Demo Switch to Admin */}
            <button
              onClick={async () => {
                await login('admin@bookleaf.com', 'admin123');
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors cursor-pointer"
              title="Quickly switch to Operations Admin View"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Switch to Admin Portal</span>
            </button>

            <button
              onClick={() => logout()}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-6 border-t border-slate-100 text-sm font-medium">
          <button
            onClick={() => setActiveTab('books')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'books'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            My Published Books
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {books.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tickets'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Support Queries & Tickets
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
              {tickets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('submit')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'submit'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Raise a Support Ticket
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {/* TAB 1: MY BOOKS */}
        {activeTab === 'books' && (
          <div className="space-y-6">
            {/* Aggregate Royalty Cards */}
            {booksSummary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 block mb-1">Total Copies Sold</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">{booksSummary.totalCopiesSold.toLocaleString()}</span>
                    <span className="text-xs text-emerald-600 font-semibold">Across platforms</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 block mb-1">Total Royalty Earned</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">₹{booksSummary.totalRoyaltyEarned.toLocaleString()}</span>
                    <span className="text-xs text-indigo-600 font-semibold">80/20 share</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 block mb-1">Total Royalty Paid</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-emerald-700">₹{booksSummary.totalRoyaltyPaid.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">Disbursed</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-xs font-medium text-slate-500 block mb-1">Current Pending Payout</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-amber-600">₹{booksSummary.totalRoyaltyPending.toLocaleString()}</span>
                    <span className="text-xs text-slate-500">
                      {booksSummary.totalRoyaltyPending >= 1000 ? 'Eligible for cycle' : 'Rolls over (< ₹1,000)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Books List Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Published & Production Titles</h2>
                <p className="text-xs text-slate-500">
                  Real-time sales figures, royalty calculations, and catalog distribution statuses.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('submit')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Ask a Question About a Book
              </button>
            </div>

            {/* Books Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {books.map((book) => {
                const isInProduction = book.status.toLowerCase().includes('production');
                const isBelowThreshold = book.royaltyPending > 0 && book.royaltyPending < 1000;

                return (
                  <div
                    key={book.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            isInProduction
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {book.status}
                        </span>

                        <span className="text-xs font-mono text-slate-400 font-medium">
                          ID: {book.id}
                        </span>
                      </div>

                      {/* Title & Genre */}
                      <h3 className="text-base font-bold text-slate-900 mb-1">{book.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-4">
                        <span>{book.genre || 'General'}</span>
                        <span>•</span>
                        <span>ISBN: {book.isbn || 'Pending Assignment'}</span>
                        {book.publicationDate && (
                          <>
                            <span>•</span>
                            <span>
                              Pub: {new Date(book.publicationDate).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Financial & Operational Breakdown */}
                      {isInProduction ? (
                        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 mb-4 space-y-1">
                          <div className="font-semibold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Book Currently in Production
                          </div>
                          <p className="text-amber-800 text-[11px] leading-relaxed">
                            Our team is currently preparing your volume ({book.status.replace('In Production - ', '')}).
                            Royalty tracking, pricing, and sales analytics will activate upon publication and distribution launch.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs mb-4">
                          <div>
                            <span className="text-slate-400 block text-[11px]">MRP / Royalty</span>
                            <span className="font-semibold text-slate-900">
                              ₹{book.mrp} / ₹{book.authorRoyaltyPerCopy}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Copies Sold</span>
                            <span className="font-semibold text-slate-900">
                              {book.totalCopiesSold.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Earned</span>
                            <span className="font-semibold text-slate-900">
                              ₹{book.totalRoyaltyEarned.toLocaleString()}
                            </span>
                          </div>
                          <div className="col-span-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-slate-500">Paid: ₹{book.royaltyPaid.toLocaleString()}</span>
                            <span className="font-bold text-slate-900">
                              Pending: <span className="text-amber-600">₹{book.royaltyPending.toLocaleString()}</span>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Threshold Edge Case Notice */}
                      {isBelowThreshold && (
                        <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 text-xs text-indigo-900 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] leading-relaxed">
                            <strong>Royalty Threshold Note:</strong> Pending amount (₹{book.royaltyPending}) is below the ₹1,000 minimum payout threshold. It will roll over to the next quarter as per BookLeaf policy.
                          </p>
                        </div>
                      )}

                      {/* Distribution Channels */}
                      {book.availableOn && book.availableOn.length > 0 && (
                        <div className="mb-3">
                          <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                            Available On:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {book.availableOn.map((platform, pIdx) => (
                              <span
                                key={pIdx}
                                className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Print: {book.printPartner || 'In-House'}
                      </span>
                      <button
                        onClick={() => {
                          setFormBookId(book.id);
                          setFormSubject(`Query regarding "${book.title}"`);
                          setActiveTab('submit');
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                      >
                        Ask About This Book
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: MY TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">My Support Tickets</h2>
                <p className="text-xs text-slate-500">
                  Track queries in real-time. Responses appear live without page refreshes.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('submit')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Submit New Query
              </button>
            </div>

            {tickets.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 mb-1">No Tickets Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Have a question about your royalties, printing quality, or production status? Submit your query to get instant AI-assisted support from our operations team.
                </p>
                <button
                  onClick={() => setActiveTab('submit')}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
                >
                  Raise Your First Ticket
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
                {tickets.map((t) => {
                  const lastMessage = t.messages[t.messages.length - 1];
                  const hasAdminReply = t.messages.some((m) => m.senderRole === 'ADMIN');

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTicket(t);
                        setTicketModalOpen(true);
                      }}
                      className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {t.ticketNumber}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                              t.status
                            )}`}
                          >
                            {t.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                            {formatCategoryName(t.category)}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md border ${getPriorityBadge(
                              t.priority
                            )}`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                          {t.subject}
                        </h4>

                        <p className="text-xs text-slate-500 line-clamp-1">
                          {lastMessage ? lastMessage.content : t.description}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          {t.book && (
                            <span className="text-indigo-600 font-medium">
                              Book: {t.book.title}
                            </span>
                          )}
                          <span>•</span>
                          <span>{t.messages.length} message(s)</span>
                          <span>•</span>
                          <span>
                            {new Date(t.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {hasAdminReply ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Official Reply
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Awaiting Response
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SUBMIT QUERY */}
        {activeTab === 'submit' && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                AI-Assisted Fast Resolution
              </div>
              <h2 className="text-xl font-bold text-slate-900">Submit a Support Ticket</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Our support system analyzes your query immediately, applies relevant BookLeaf publishing policies, and connects with our Delhi ops team.
              </p>
            </div>

            {submitSuccessNotice && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Ticket Successfully Raised!</span>
                  <span>{submitSuccessNotice}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              {/* Book selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Which book is this query about?
                </label>
                <select
                  value={formBookId}
                  onChange={(e) => setFormBookId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="GENERAL">General / Account Level / Multiple Books</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royalty payout timeline for Q3 / Printing defect on copies"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Detailed Query Description *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Please provide full details (e.g. amounts, specific copies, defective pages, platform link) so our team can resolve it swiftly."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Optional Attachment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Attach File (Optional — photos for quality defects, bank proofs, screenshots)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-medium text-slate-700 transition-colors">
                    <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFormAttachment(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  {formAttachment ? (
                    <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      {formAttachment.name} ({(formAttachment.size / 1024).toFixed(0)} KB)
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">No file selected</span>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-xs transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submittingTicket ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing with AI & Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Query
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* TICKET DETAILS MODAL (Real-time conversation thread) */}
      {ticketModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded border border-indigo-200">
                    {selectedTicket.ticketNumber}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                      selectedTicket.status
                    )}`}
                  >
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 font-medium">
                    {formatCategoryName(selectedTicket.category)}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md border ${getPriorityBadge(
                      selectedTicket.priority
                    )}`}
                  >
                    {selectedTicket.priority} Priority
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{selectedTicket.subject}</h3>
                {selectedTicket.book && (
                  <span className="text-xs text-indigo-600 font-medium">
                    Regarding Book: {selectedTicket.book.title}
                  </span>
                )}
              </div>

              <button
                onClick={() => setTicketModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Conversation Timeline */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {selectedTicket.attachmentName && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <span>Attached File: {selectedTicket.attachmentName}</span>
                </div>
              )}

              {selectedTicket.messages.map((m) => {
                const isAdmin = m.senderRole === 'ADMIN';

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                        isAdmin
                          ? 'bg-indigo-50/90 border border-indigo-100 text-slate-900'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1.5 border-b pb-1 border-current/15">
                        <span className="font-bold flex items-center gap-1.5">
                          {isAdmin ? (
                            <>
                              <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                                B
                              </div>
                              BookLeaf Operations Team
                            </>
                          ) : (
                            user.name
                          )}
                        </span>
                        <span className="text-[10px] opacity-75">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="whitespace-pre-wrap">{m.content}</div>

                      {m.isAiAssisted && isAdmin && (
                        <div className="mt-2 pt-1 border-t border-indigo-200/60 text-[10px] text-indigo-700 flex items-center gap-1 font-medium">
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          Knowledge Base verified response
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer - Author Reply Composer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a follow-up reply to BookLeaf support..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {sendingReply ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Reply
                    </>
                  )}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1.5">
                Press Enter to send. Updates will be broadcasted live to the operations team.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
