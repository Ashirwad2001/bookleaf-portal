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

  const handleQuickDemoSelect = (selectedEmail: string, selectedPass: string) => {
    setEmail(selectedEmail);
    setPassword(selectedPass);
    setAuthMode('signin');
    setErrorMsg('');
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-dark-grid-pattern opacity-40 pointer-events-none" />

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            B
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block">
              BookLeaf Publishing
            </span>
            <span className="text-[11px] font-medium text-slate-400 block -mt-0.5">
              Author Support & Operations Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-sm">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="font-medium">SSE Realtime Active</span>
          </div>
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700/80 transition-all hover:border-slate-600 shadow-sm"
          >
            <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
            API Docs
          </Link>
          {user && (
            <Link
              href={user.role === 'ADMIN' ? '/admin' : '/author'}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-lg transition-all shadow-md shadow-indigo-600/25"
            >
              Go to Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </header>

      {/* Hero & Login Area */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Context & Overview */}
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-950/90 to-slate-900 border border-indigo-700/40 text-indigo-300 text-xs font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Powered by Google Gemini & Policy Knowledge Base</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Author Support <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
                At Publishing Scale
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              BookLeaf processes 1,200+ books monthly across 22,000+ catalog titles.
              This platform bridges authors and our operations team with real-time ticket streaming,
              instant auto-classification, priority scoring, and Knowledge Base grounded draft responses.
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-4 transition-all hover:bg-slate-900/90 shadow-sm group">
                <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-sm mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  Auto-Classification
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Categorizes queries into Royalties, ISBN, Printing Defects, Distribution, or Production.
                </p>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 transition-all hover:bg-slate-900/90 shadow-sm group">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  Real-Time Updates
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Server-Sent Events push replies and status changes to authors instantly without page refresh.
                </p>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 transition-all hover:bg-slate-900/90 shadow-sm group">
                <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  Grounded AI Drafts
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Drafts strictly cite BookLeaf 80/20 split, ₹1,000 threshold, 45-day cycle, and reprint SLAs.
                </p>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 hover:border-sky-500/40 rounded-xl p-4 transition-all hover:bg-slate-900/90 shadow-sm group">
                <div className="flex items-center gap-2.5 text-sky-400 font-bold text-sm mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-sky-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  Admin Controls
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Urgent-first queue, category & priority overrides, private internal notes, and assignment.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card & Demo Switcher */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 glow-indigo">
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
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  {authMode === 'signin' ? 'Portal Sign In' : 'Register New Account'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {authMode === 'signin'
                    ? 'Enter your credentials or choose a pre-seeded test persona below'
                    : 'Sign up with your personal Gmail or email address'}
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 shadow-sm">
                  <span className="font-bold">Error:</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Account Role
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('AUTHOR')}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          role === 'AUTHOR'
                            ? 'bg-indigo-600/30 border-indigo-500 text-white'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        ✍️ Author Account
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('ADMIN')}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          role === 'ADMIN'
                            ? 'bg-purple-600/30 border-purple-500 text-white'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
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
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
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

              {/* Demo Evaluation Accounts Quick Switcher */}
              <div className="mt-6 pt-5 border-t border-slate-700/80">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Quick Demo Personas (1-Click)
                  </span>
                  <span className="text-[10px] text-indigo-400 font-medium">Pre-seeded</span>
                </div>

                <div className="space-y-2">
                  {/* Admin Account */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@bookleaf.com', 'admin123')}
                    className="w-full text-left p-2.5 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-700/60 transition-all flex items-center justify-between group cursor-pointer shadow-sm hover:shadow-md hover:border-indigo-500"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-md shadow-purple-500/20">
                        ⚙️
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white block">
                            BookLeaf Ops Admin
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            LEAD
                          </span>
                        </div>
                        <span className="text-[10px] text-purple-200/80 block">
                          Triage queue, AI overrides & policy drafts
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-white bg-indigo-600 group-hover:bg-indigo-500 px-2.5 py-1 rounded-lg transition-colors shadow-sm">
                      Enter →
                    </span>
                  </button>

                  {/* Priya Sharma - Live Books & Pending Royalty */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('priya.sharma@email.com', 'author123')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition-all flex items-center justify-between group cursor-pointer hover:border-emerald-500/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center text-xs font-black">
                        PS
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white block">
                            Priya Sharma (Author)
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            2 LIVE
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          Whispers of the Ganges • ₹3,570 pending
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors">
                      Enter →
                    </span>
                  </button>

                  {/* Kavita Deshmukh - Below Threshold & Production */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('kavita.deshmukh@email.com', 'author123')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition-all flex items-center justify-between group cursor-pointer hover:border-amber-500/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center text-xs font-black">
                        KD
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white block">
                            Kavita Deshmukh (Author)
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            ROLLOVER
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          Typesetting stage • ₹850 (&lt; ₹1k threshold)
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors">
                      Enter →
                    </span>
                  </button>

                  {/* Farhan Sheikh - Defective Copies */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('farhan.sheikh@email.com', 'author123')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition-all flex items-center justify-between group cursor-pointer hover:border-rose-500/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center justify-center text-xs font-black">
                        FS
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white block">
                            Farhan Sheikh (Author)
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            REPRINT
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          Ghazal of Forgotten • Quality defect inquiry
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors">
                      Enter →
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 px-6 py-4 text-center text-xs text-slate-500">
        BookLeaf Publishing Technical Assessment • Full-Stack Author Support Portal
      </footer>
    </div>
  );
}
