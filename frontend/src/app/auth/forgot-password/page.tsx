"use client";

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Mail, KeyRound, Lock, CheckCircle, ArrowLeft } from 'lucide-react';

type Step = 'enter-email' | 'verify-otp' | 'new-password';

function ForgotPasswordForm() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('enter-email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 1: Request OTP
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/auth/forgot-password', { email });
            toast.success('OTP Sent', { description: 'Check your email for a 6-digit code.' });
            setStep('verify-otp');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) { toast.error('Please enter the 6-digit OTP.'); return; }
        setLoading(true);
        try {
            await api.post('/api/auth/verify-reset-otp', { email, otp });
            toast.success('OTP Verified', { description: 'Now set your new password.' });
            setStep('new-password');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Invalid OTP.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match.'); return; }
        setLoading(true);
        try {
            await api.post('/api/auth/reset-password', { email, otp, newPassword });
            toast.success('Password Reset!', { description: 'You can now sign in with your new password.' });
            router.push('/auth/login');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        try {
            await api.post('/api/auth/forgot-password', { email });
            toast.success('OTP Resent!', { description: 'A new OTP has been sent to your email.' });
            setOtp('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-4 py-20 w-full max-w-7xl mx-auto">
            <div className="w-full max-w-md bg-surface border border-surface-border rounded-2xl p-8 shadow-xl">

                {/* Back to Login */}
                <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <ArrowLeft className="h-4 w-4" /> Back to Sign In
                </Link>

                {/* Step 1: Enter Email */}
                {step === 'enter-email' && (
                    <>
                        <div className="text-center mb-8">
                            <div className="h-14 w-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                                <Mail className="h-7 w-7 text-accent" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-foreground mb-1">Forgot Password?</h1>
                            <p className="text-muted-foreground text-sm">Enter your email and we'll send you a verification code.</p>
                        </div>
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                                <input
                                    type="email" required value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-surface-border bg-background text-foreground focus:ring-accent focus:border-accent"
                                    placeholder="you@email.com"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-accent text-white font-bold rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-50">
                                {loading ? <><Loader2 className="h-5 w-5 animate-spin mr-2 inline" />Sending...</> : 'Send OTP'}
                            </button>
                        </form>
                    </>
                )}

                {/* Step 2: Verify OTP */}
                {step === 'verify-otp' && (
                    <>
                        <div className="text-center mb-8">
                            <div className="h-14 w-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                                <KeyRound className="h-7 w-7 text-accent" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-foreground mb-1">Check Your Email</h1>
                            <p className="text-muted-foreground text-sm">We sent a 6-digit OTP to <span className="font-semibold text-foreground">{email}</span>.</p>
                        </div>
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Enter OTP</label>
                                <input
                                    type="text" inputMode="numeric" maxLength={6}
                                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-3 rounded-xl border border-surface-border bg-background text-foreground text-center tracking-[0.75em] text-xl font-mono focus:ring-accent focus:border-accent"
                                    placeholder="000000"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-accent text-white font-bold rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-50">
                                {loading ? <><Loader2 className="h-5 w-5 animate-spin mr-2 inline" />Verifying...</> : 'Verify OTP'}
                            </button>
                            <button type="button" onClick={handleResend} disabled={loading} className="w-full text-center text-sm text-muted-foreground hover:text-accent transition-colors disabled:opacity-50">
                                Didn't receive it? <span className="font-semibold underline">Resend OTP</span>
                            </button>
                        </form>
                    </>
                )}

                {/* Step 3: Set New Password */}
                {step === 'new-password' && (
                    <>
                        <div className="text-center mb-8">
                            <div className="h-14 w-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                                <Lock className="h-7 w-7 text-green-500" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-foreground mb-1">Set New Password</h1>
                            <p className="text-muted-foreground text-sm">Choose a strong new password for your account.</p>
                        </div>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">New Password</label>
                                <input
                                    type="password" required minLength={6}
                                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-surface-border bg-background text-foreground focus:ring-accent focus:border-accent"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Confirm Password</label>
                                <input
                                    type="password" required
                                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-surface-border bg-background text-foreground focus:ring-accent focus:border-accent"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-accent text-white font-bold rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-50">
                                {loading ? <><Loader2 className="h-5 w-5 animate-spin mr-2 inline" />Saving...</> : 'Reset Password'}
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
