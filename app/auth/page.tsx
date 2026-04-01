'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase-client';

type Mode = 'login' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/my-shops');
    });
  }, [router]);

  const handleSubmit = async () => {
    setError('');
    setMessage('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Account created! Check your email for a confirmation link, then sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/my-shops');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto px-6 py-20 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-stone-400 hover:text-amber-400 font-medium mb-12 transition-colors"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back Home
        </Link>

        <div className="text-center mb-10 animate-fadeUp">
          <div className="w-20 h-20 bg-stone-900 border border-white/5 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-6 shadow-inner shadow-black/50">
            ☕
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-stone-100 to-stone-400 mb-3 tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-stone-400 text-lg">
            {mode === 'login' ? 'Sign in to manage your shops' : 'Start building customer loyalty'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-stone-900 rounded-xl p-1 mb-8 border border-white/5 animate-fadeUp stagger-delay-1">
          <button
            onClick={() => { setMode('login'); setError(''); setMessage(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
              mode === 'login' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
              mode === 'signup' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="glass-card p-8 animate-fadeUp stagger-delay-2">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3.5 bg-stone-950 border border-white/10 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-stone-950 border border-white/10 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition font-medium"
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
              />
            </div>
          </div>

          {error && (
            <div className="mt-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-5 p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-medium">
              {message}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full btn-amber py-4 rounded-xl text-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl shadow-amber-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-5 h-5 border-2 border-stone-950/20 border-t-stone-950 rounded-full animate-spin" />
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
