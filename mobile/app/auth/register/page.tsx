"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParams = searchParams.get('redirect');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        name,
        email,
        password,
        role: 'user'
      });

      toast.success('Success', { description: `Check your email to verify account.` });
      router.push(`/auth/login${redirectParams ? `?redirect=${encodeURIComponent(redirectParams)}` : ''}`);
    } catch (error: any) {
      toast.error('Registration Failed', { description: error.response?.data?.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 w-full">
      <Link href="/auth/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-12">
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-bold">Back</span>
      </Link>

      <div className="w-full max-w-md mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-foreground mb-2">Join Us</h1>
          <p className="text-muted-foreground text-sm">Create your LA Studio account.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl border border-surface-border bg-surface text-foreground focus:ring-1 focus:ring-accent outline-none"
              placeholder="John Doe"
            />
          </div>
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
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl border border-surface-border bg-surface text-foreground focus:ring-1 focus:ring-accent outline-none"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 bg-accent text-white font-black rounded-2xl hover:bg-accent-hover transition-all active:scale-[0.98] disabled:opacity-50 mt-4 shadow-lg shadow-accent/20"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Create Account'}
          </button>
        </form>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          Already a member?{' '}
          <Link href={`/auth/login${redirectParams ? `?redirect=${encodeURIComponent(redirectParams)}` : ''}`} className="text-accent font-black hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
