"use client";

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Mail, KeyRound, Lock, ArrowLeft } from 'lucide-react';

type Step = 'enter-email' | 'verify-otp' | 'new-password';

function ForgotPasswordForm() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('enter-email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/auth/forgot-password', { email });
            toast.success('OTP Sent');
            setStep('verify-otp');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
        setLoading(true);
        try {
            await api.post('/api/auth/verify-reset-otp', { email, otp });
            toast.success('Verified');
            setStep('new-password');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) { toast.error('Min 6 characters'); return; }
        if (newPassword !== confirmPassword) { toast.error('Mismatch'); return; }
        setLoading(true);
        try {
            await api.post('/api/auth/reset-password', { email, otp, newPassword });
            toast.success('Password Reset');
            router.push('/auth/login');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col p-4 w-full">
            <Link href="/auth/login" className="inline-flex items-center gap-2 text-muted-foreground mb-12">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-bold">Back</span>
            </Link>

            <div className="w-full max-w-md mx-auto">
                {step === 'enter-email' && (
                    <>
                        <div className="mb-10 text-center">
                            <div className="h-16 w-16 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                                <Mail className="h-8 w-8 text-accent" />
                            </div>
                            <h1 className="text-3xl font-black text-foreground mb-2">Forgot it?</h1>
                            <p className="text-muted-foreground text-sm">We'll send you a reset code.</p>
                        </div>
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <input
                                type="email" required placeholder="Email Address" value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-4 rounded-2xl border border-surface-border bg-surface text-foreground focus:ring-1 focus:ring-accent outline-none"
                            />
                            <button type="submit" disabled={loading} className="w-full py-4 bg-accent text-white font-black rounded-2xl shadow-lg shadow-accent/20 disabled:opacity-50">
                                {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Send OTP'}
                            </button>
                        </form>
                    </>
                )}

                {step === 'verify-otp' && (
                    <>
                        <div className="mb-10 text-center">
                            <div className="h-16 w-16 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                                <KeyRound className="h-8 w-8 text-accent" />
                            </div>
                            <h1 className="text-3xl font-black text-foreground mb-2">Check Email</h1>
                            <p className="text-muted-foreground text-sm">Token sent to {email}</p>
                        </div>
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <input
                                type="text" maxLength={6} placeholder="000000" value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="w-full px-4 py-4 rounded-2xl border border-surface-border bg-surface text-center tracking-[1em] font-mono text-xl focus:ring-1 focus:ring-accent outline-none"
                            />
                            <button type="submit" disabled={loading} className="w-full py-4 bg-accent text-white font-black rounded-2xl shadow-lg shadow-accent/20">
                                {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Verify'}
                            </button>
                        </form>
                    </>
                )}

                {step === 'new-password' && (
                    <>
                        <div className="mb-10 text-center">
                            <div className="h-16 w-16 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                                <Lock className="h-8 w-8 text-accent" />
                            </div>
                            <h1 className="text-3xl font-black text-foreground mb-2">New Password</h1>
                            <p className="text-muted-foreground text-sm">Secure your account with a new password.</p>
                        </div>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <input
                                type="password" required placeholder="New Password" value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-4 rounded-2xl border border-surface-border bg-surface text-foreground focus:ring-1 focus:ring-accent outline-none"
                            />
                            <input
                                type="password" required placeholder="Confirm Password" value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-4 rounded-2xl border border-surface-border bg-surface text-foreground focus:ring-1 focus:ring-accent outline-none"
                            />
                            <button type="submit" disabled={loading} className="w-full py-4 bg-accent text-white font-black rounded-2xl shadow-lg shadow-accent/20">
                                {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Update Password'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <ForgotPasswordForm />
        </Suspense>
    );
}
