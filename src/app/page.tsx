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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-500/20">
            B
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white block">
              BookLeaf Publishing
            </span>
            <span className="text-[11px] text-slate-400 block -mt-0.5">
              Author Support & Operations Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>SSE Realtime Active</span>
          </div>
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700 transition-colors"
          >
            <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
            API Docs
          </Link>
          {user && (
            <Link
              href={user.role === 'ADMIN' ? '/admin' : '/author'}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
            >
              Go to Dashboard
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </header>

      {/* Hero & Login Area */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Context & Overview */}
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Powered by Google Gemini & Policy Knowledge Base
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
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
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5">
                <div className="flex items-center gap-2.5 text-indigo-400 font-semibold text-sm mb-1">
                  <Sparkles className="w-4 h-4" />
                  Auto-Classification
                </div>
                <p className="text-xs text-slate-400">
                  Categorizes queries into Royalties, ISBN, Printing Defects, Distribution, or Production.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5">
                <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-sm mb-1">
                  <Zap className="w-4 h-4" />
                  Real-Time Updates
                </div>
                <p className="text-xs text-slate-400">
                  Server-Sent Events push replies and status changes to authors instantly without page refresh.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5">
                <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-sm mb-1">
                  <Shield className="w-4 h-4" />
                  Grounded AI Drafts
                </div>
                <p className="text-xs text-slate-400">
                  Drafts strictly cite BookLeaf 80/20 split, ₹1,000 threshold, 45-day cycle, and reprint SLAs.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5">
                <div className="flex items-center gap-2.5 text-sky-400 font-semibold text-sm mb-1">
                  <UserCheck className="w-4 h-4" />
                  Admin Controls
                </div>
                <p className="text-xs text-slate-400">
                  Urgent-first queue, category & priority overrides, private internal notes, and assignment.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card & Demo Switcher */}
          <div className="lg:col-span-5">
            <div className="bg-slate-800/90 border border-slate-700/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              {/* Tab Switcher: Sign In vs Create Account */}
              <div className="flex rounded-xl bg-slate-900/90 p-1 mb-6 border border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-indigo-600 text-white shadow-sm'
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
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account (Gmail)
                </button>
              </div>

              <div className="mb-5">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {authMode === 'signin' ? 'Portal Sign In' : 'Register New Account'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {authMode === 'signin'
                    ? 'Enter your credentials or choose a pre-seeded test persona below'
                    : 'Sign up with your personal Gmail or email address'}
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
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

                <div className="space-y-1.5">
                  {/* Admin Account */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@bookleaf.com', 'admin123')}
                    className="w-full text-left p-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/50 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold">
                        ⚙️
                      </div>
                      <div>
                        <span className="text-xs font-medium text-white block">
                          BookLeaf Ops Admin
                        </span>
                        <span className="text-[10px] text-purple-300 block">
                          Full ticket queue & AI controls
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-indigo-400 group-hover:text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/10">
                      Login →
                    </span>
                  </button>

                  {/* Priya Sharma - Live Books & Pending Royalty */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('priya.sharma@email.com', 'author123')}
                    className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-700/50 border border-slate-700 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold">
                        P
                      </div>
                      <div>
                        <span className="text-xs font-medium text-white block">
                          Priya Sharma (Author)
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          2 live books, ₹3,570 pending royalty
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-white px-2 py-0.5 rounded bg-slate-800">
                      Login →
                    </span>
                  </button>

                  {/* Kavita Deshmukh - Below Threshold & Production */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('kavita.deshmukh@email.com', 'author123')}
                    className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-700/50 border border-slate-700 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold">
                        K
                      </div>
                      <div>
                        <span className="text-xs font-medium text-white block">
                          Kavita Deshmukh (Author)
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Typesetting book + ₹850 below-threshold
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-white px-2 py-0.5 rounded bg-slate-800">
                      Login →
                    </span>
                  </button>

                  {/* Farhan Sheikh - Defective Copies */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('farhan.sheikh@email.com', 'author123')}
                    className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-700/50 border border-slate-700 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-rose-500/20 text-rose-300 flex items-center justify-center text-xs font-bold">
                        F
                      </div>
                      <div>
                        <span className="text-xs font-medium text-white block">
                          Farhan Sheikh (Author)
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Urdu poetry, critical reprint claim
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-white px-2 py-0.5 rounded bg-slate-800">
                      Login →
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
