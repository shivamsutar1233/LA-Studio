"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email address...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid or missing verification token.');
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await api.get(`/api/auth/verify?token=${token}`);
                setStatus('success');
                setMessage(response.data.message || 'Email verified successfully!');
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed. The link might be expired or invalid.');
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 py-20 w-full max-w-7xl mx-auto min-h-[60vh]">
            <div className="w-full max-w-md bg-surface border border-surface-border rounded-3xl p-8 shadow-2xl text-center">

                {status === 'verifying' && (
                    <div className="flex flex-col items-center animate-in fade-in duration-500">
                        <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                            <Loader2 className="h-10 w-10 text-accent animate-spin" />
                        </div>
                        <h1 className="text-2xl font-black text-foreground mb-2">Verifying Email</h1>
                        <p className="text-muted-foreground">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                        <div className="h-20 w-20 rounded-full bg-green-500/20 shadow-inner flex items-center justify-center mb-6 ring-8 ring-green-500/10">
                            <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                        <h1 className="text-2xl font-black text-foreground mb-3">Verified Successfully</h1>
                        <p className="text-muted-foreground mb-8">{message}</p>
                        <Link
                            href="/auth/login"
                            className="w-full py-4 text-center bg-accent text-white font-bold rounded-xl hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20 block"
                        >
                            Sign In to Your Account
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                        <div className="h-20 w-20 rounded-full bg-red-500/20 shadow-inner flex items-center justify-center mb-6 ring-8 ring-red-500/10">
                            <XCircle className="h-10 w-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-black text-foreground mb-3">Verification Failed</h1>
                        <p className="text-muted-foreground mb-8">{message}</p>
                        <div className="flex gap-4 w-full">
                            <Link
                                href="/auth/register"
                                className="w-full py-3 text-center bg-surface border border-surface-border text-foreground font-bold rounded-xl hover:bg-surface-border transition-colors block"
                            >
                                Sign Up Again
                            </Link>
                            <Link
                                href="/auth/login"
                                className="w-full py-3 text-center bg-accent text-white font-bold rounded-xl hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20 block"
                            >
                                Go to Login
                            </Link>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
