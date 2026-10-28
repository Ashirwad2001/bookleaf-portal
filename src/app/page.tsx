'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  Sparkles,
  Shield,
  ArrowRight,
  UserCheck,
  User,
  CheckCircle2,
  Lock,
  Mail,
  Zap,
  Radio,
  FileCode2,
  Layers,
  Clock,
  TrendingUp,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function LoginPage() {
  const { login, register, user } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'AUTHOR' | 'ADMIN'>('AUTHOR');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (authMode === 'register') {
        const result = await register(name, email, password, role);
        if (!result.success) {
          setErrorMsg(result.error || 'Failed to create account');
        }
      } else {
        const result = await login(email, password);
        if (!result.success) {
          setErrorMsg(result.error || 'Invalid credentials');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (selectedEmail: string, selectedPass: string) => {
    setEmail(selectedEmail);
    setPassword(selectedPass);
    setAuthMode('signin');
    setErrorMsg('');
    setLoading(true);
    try {
      const result = await login(selectedEmail, selectedPass);
      if (!result.success) {
        setErrorMsg(result.error || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 aurora-bg flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden text-slate-100">
      {/* Dynamic Multi-Layer Ambient Glow Orbs */}
      <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse-subtle" />
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[550px] h-[550px] bg-emerald-500/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-dark-grid-pattern opacity-30 pointer-events-none" />

      {/* Floating Glassmorphic Navbar */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 sticky top-0 z-40">
        <header className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl px-5 sm:px-6 py-3.5 flex items-center justify-between shadow-2xl ring-1 ring-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              B
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white block leading-tight">
                BookLeaf Publishing
              </span>
              <span className="text-[11px] font-medium text-slate-400 block">
                Author Support & Operations Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live SSE Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 font-semibold shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">SSE Realtime Live</span>
            </div>

            <Link
              href="/docs"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all hover:border-white/20 shadow-xs"
            >
              <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>API Docs</span>
            </Link>

            {user && (
              <Link
                href={user.role === 'ADMIN' ? '/admin' : '/author'}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-500/30"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </header>
      </div>

      {/* Main Content: Hero & Auth Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 relative z-10 w-full max-w-7xl mx-auto">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT: Context, Metrics, Feature Grid & Live Telemetry Stream (col-span-7) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/90 border border-indigo-500/30 text-indigo-300 text-xs font-bold shadow-lg shadow-indigo-950/50">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Google Gemini 3.5 & Policy Knowledge Base Engine</span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-3">
                Author Support <br />
                <span className="shimmer-text">At Enterprise Scale</span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                BookLeaf processes <strong>1,200+ books monthly</strong> across <strong>22,000+ catalog titles</strong>.
                This mission-critical portal bridges authors and our Delhi operations team with instant query auto-classification, priority scoring, and strictly policy-grounded responses in under 2 seconds.
              </p>
            </div>

            {/* Publishing Scale Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-xl">
              <div className="p-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Catalog Titles
                </span>
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight">22,000+</span>
                <span className="text-[10px] text-indigo-400 font-medium block">Across India</span>
              </div>
              <div className="p-2.5 border-l border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Monthly Volume
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">1,200+</span>
                <span className="text-[10px] text-emerald-300/80 font-medium block">New Releases</span>
              </div>
              <div className="p-2.5 border-l border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  AI Triage SLA
                </span>
                <span className="text-xl sm:text-2xl font-black text-sky-400 tracking-tight">&lt; 2.0s</span>
                <span className="text-[10px] text-sky-300/80 font-medium block">Classification</span>
              </div>
              <div className="p-2.5 border-l border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Author Share
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">80 / 20</span>
                <span className="text-[10px] text-amber-300/80 font-medium block">Net Profit Split</span>
              </div>
            </div>

            {/* 4 Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-slate-900/60 border border-white/10 hover:border-indigo-500/50 rounded-2xl p-4 transition-all duration-300 hover:bg-slate-900/90 shadow-md relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-indigo-600" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    Auto-Classification
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    6 Classes
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Deeply categorizes queries into Royalties, ISBN Metadata, Print Defects, Distribution, or Production with urgency scoring.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-4 transition-all duration-300 hover:bg-slate-900/90 shadow-md relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-500" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    Real-Time Streaming
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    0ms Polling
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Server-Sent Events (SSE) push official replies and status changes to authors instantly without refreshing the page.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-white/10 hover:border-amber-500/50 rounded-2xl p-4 transition-all duration-300 hover:bg-slate-900/90 shadow-md relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-500" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    Grounded AI Drafts
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Strict Grounding
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Drafts strictly cite BookLeaf 80/20 split, ₹1,000 threshold rollover, 45-day sales verification, and 100% free reprint SLA.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-white/10 hover:border-sky-500/50 rounded-2xl p-4 transition-all duration-300 hover:bg-slate-900/90 shadow-md relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 to-sky-500" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    Operations Cockpit
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    RBAC Admin
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Urgent-first sorting, 1-click policy category & priority overrides, private operations notes, and admin assignment.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Login Card & Pre-Seeded Personas (col-span-5) */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 glow-indigo relative overflow-hidden">
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />

              {/* Tab Switcher: Sign In vs Create Account */}
              <div className="flex rounded-xl bg-slate-950 p-1 mb-6 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account (Gmail)
                </button>
              </div>

              <div className="mb-5">
                <h2 className="text-xl font-black text-white tracking-tight">
                  {authMode === 'signin' ? 'Portal Sign In' : 'Register New Account'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {authMode === 'signin'
                    ? 'Enter your credentials or choose a pre-seeded evaluation persona below'
                    : 'Sign up with your personal Gmail or work email address'}
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Authentication Error:</span>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-3.5">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ashirwad Chopra"
                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {authMode === 'register' ? 'Your Gmail / Email Address' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={authMode === 'register' ? 'yourname@gmail.com' : 'e.g. priya.sharma@email.com'}
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Account Role
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('AUTHOR')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          role === 'AUTHOR'
                            ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-xs'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        ✍️ Author Account
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('ADMIN')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          role === 'ADMIN'
                            ? 'bg-purple-600/30 border-purple-500 text-white shadow-xs'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        🛡️ Operations Admin
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 hover:from-indigo-400 hover:to-emerald-400 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {authMode === 'register' ? 'Create Account & Enter Portal' : 'Sign In to Portal'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Pre-Seeded Evaluation Personas (1-Click Instant Login) */}
              <div className="mt-6 pt-5 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Evaluation Personas
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    1-Click Login
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Admin Persona */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@bookleaf.com', 'admin123')}
                    className="w-full text-left p-2.5 rounded-xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 hover:from-purple-900/80 hover:to-indigo-900/80 border border-purple-500/40 transition-all flex items-center justify-between group cursor-pointer shadow-sm hover:shadow-md hover:border-purple-400"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-600/30 text-purple-200 border border-purple-400/40 flex items-center justify-center text-sm font-black shadow-md shrink-0">
                        🛡️
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">
                            BookLeaf Ops Admin
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
                            LEAD
                          </span>
                        </div>
                        <span className="text-[10px] text-purple-200/80 block truncate">
                          Triage queue, AI overrides & policy drafts
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-white bg-purple-600 group-hover:bg-purple-500 px-2.5 py-1 rounded-lg transition-colors shadow-sm shrink-0 ml-2">
                      Enter →
                    </span>
                  </button>

                  {/* Priya Sharma */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('priya.sharma@email.com', 'author123')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-xs font-black shrink-0">
                        PS
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">
                            Priya Sharma (Author)
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                            2 LIVE
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Whispers of the Ganges • ₹3,570 Pending
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors shrink-0 ml-2">
                      Enter →
                    </span>
                  </button>

                  {/* Kavita Deshmukh */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('kavita.deshmukh@email.com', 'author123')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xs font-black shrink-0">
                        KD
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">
                            Kavita Deshmukh (Author)
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                            ROLLOVER
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Typesetting stage • ₹850 (&lt; ₹1,000 threshold)
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors shrink-0 ml-2">
                      Enter →
                    </span>
                  </button>

                  {/* Sneha Kulkarni */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('sneha.kulkarni@email.com', 'author123')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/40 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center text-xs font-black shrink-0">
                        SK
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">
                            Sneha Kulkarni (Author)
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                            REPRINT CLAIM
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Echoes in the Shadows • Print defect claim
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors shrink-0 ml-2">
                      Enter →
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Minimal Footer */}
      <footer className="border-t border-white/5 bg-slate-950/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">BookLeaf Publishing</span>
            <span>•</span>
            <span>New Delhi Headquarters</span>
            <span>•</span>
            <span className="text-indigo-400">Ashirwad Chopra</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono">Next.js 16.4</span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono">Prisma Postgres</span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono">Google Gemini</span>
            <Link href="/docs" className="hover:text-white transition-colors underline">
              OpenAPI 3.0 Specs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
