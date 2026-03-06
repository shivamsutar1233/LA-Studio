"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { Loader2, ArrowLeft } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParams = searchParams.get('redirect');
  const authLogin = useAuthStore((state) => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      authLogin(response.data.user, response.data.token);
      toast.success('Welcome back!');
      if (redirectParams) {
        router.push(redirectParams);
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error('Login Failed', { description: error.response?.data?.message || 'Check your credentials.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 w-full">
      <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-12">
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-bold">Back</span>
      </Link>

      <div className="w-full max-w-md mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-foreground mb-2">Sign In</h1>
          <p className="text-muted-foreground text-sm">Welcome back to LA Studio.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl border border-surface-border bg-surface text-foreground focus:ring-1 focus:ring-accent outline-none"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Password</label>
              <Link href="/auth/forgot-password" className="text-[10px] font-bold text-accent uppercase tracking-wider">
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl border border-surface-border bg-surface text-foreground focus:ring-1 focus:ring-accent outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 bg-accent text-white font-black rounded-2xl hover:bg-accent-hover transition-all active:scale-[0.98] disabled:opacity-50 mt-4 shadow-lg shadow-accent/20"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          New here?{' '}
          <Link href={`/auth/register${redirectParams ? `?redirect=${encodeURIComponent(redirectParams)}` : ''}`} className="text-accent font-black hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
