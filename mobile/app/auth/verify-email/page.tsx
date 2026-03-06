"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid token.');
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await api.get(`/api/auth/verify?token=${token}`);
                setStatus('success');
                setMessage(response.data.message || 'Verified!');
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed.');
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div className="flex-1 flex flex-col p-4 w-full">
            <Link href="/auth/login" className="inline-flex items-center gap-2 text-muted-foreground mb-12">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-bold">Sign In</span>
            </Link>

            <div className="w-full max-w-md mx-auto text-center">
                {status === 'verifying' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="h-16 w-16 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="h-8 w-8 text-accent animate-spin" />
                        </div>
                        <h1 className="text-2xl font-black text-foreground mb-2">Verifying</h1>
                        <p className="text-sm text-muted-foreground">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="animate-in zoom-in-95 duration-500">
                        <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                        <h1 className="text-2xl font-black text-foreground mb-2">Verified!</h1>
                        <p className="text-sm text-muted-foreground mb-10">{message}</p>
                        <Link href="/auth/login" className="w-full py-4 block bg-accent text-white font-black rounded-2xl shadow-lg shadow-accent/20">
                            Sign In
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="animate-in zoom-in-95 duration-500">
                        <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                            <XCircle className="h-10 w-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-black text-foreground mb-2">Failed</h1>
                        <p className="text-sm text-muted-foreground mb-10">{message}</p>
                        <Link href="/auth/register" className="w-full py-4 block bg-surface border border-surface-border text-foreground font-black rounded-2xl mb-4">
                            Try Again
                        </Link>
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
