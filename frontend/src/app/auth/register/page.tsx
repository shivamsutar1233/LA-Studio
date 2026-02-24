"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Hidden field to allow testing admin flow easily without DB seeding scripts
  const [isAdmin, setIsAdmin] = useState(false); 
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
        role: isAdmin ? 'admin' : 'user' 
      });
      
      toast.success('Registration Successful', { description: `You can now sign in.` });
      // Auto redirect to login, preserving any redirect param
      router.push(`/auth/login${redirectParams ? `?redirect=${encodeURIComponent(redirectParams)}` : ''}`);
    } catch (error: any) {
      toast.error('Registration Failed', { description: error.response?.data?.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-20 w-full max-w-7xl mx-auto">
      <div className="w-full max-w-md bg-surface border border-surface-border rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground text-sm">Join Lean Angle Studio to rent premium gear.</p>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-surface-border bg-background text-foreground focus:ring-accent focus:border-accent"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-surface-border bg-background text-foreground focus:ring-accent focus:border-accent"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-surface-border bg-background text-foreground focus:ring-accent focus:border-accent"
              placeholder="••••••••"
              minLength={6}
            />
          </div>
          
          {/* Dev toggle for testing Admin flows */}
          {/* <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="adminToggle" 
              checked={isAdmin} 
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="rounded border-surface-border text-accent focus:ring-accent"
            />
            <label htmlFor="adminToggle" className="text-sm text-muted-foreground">Register as Admin (For Testing)</label>
          </div> */}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 mt-2 bg-accent text-white font-bold rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href={`/auth/login${redirectParams ? `?redirect=${encodeURIComponent(redirectParams)}` : ''}`} className="text-accent font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center p-20"><p className="text-muted-foreground animate-pulse">Loading...</p></div>}>
      <RegisterForm />
    </Suspense>
  );
}
