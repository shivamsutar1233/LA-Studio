"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function FeaturedBundlesSection() {
    const [bundles, setBundles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBundles = async () => {
            try {
                const res = await api.get('/api/bundles/featured');
                setBundles(res.data);
            } catch (err) {
                console.error("Failed to fetch featured bundles", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBundles();
    }, []);

    if (loading) {
        return <div className="py-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
    }

    if (bundles.length === 0) return null;

    return (
        <section className="py-24 relative z-10 w-full">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full filter blur-[100px] pointer-events-none -z-10"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel mb-4 border-none">
                        <span className="text-xs font-bold text-accent tracking-wide uppercase">Best Value</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">Ready-to-Ride Kits</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Save time and money with our complete, pre-configured bundles. Everything you need to start recording.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {bundles.map(bundle => (
                        <div key={bundle.id} className="glass-panel rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center group transition-all hover:-translate-y-1">
                            <div className="w-full md:w-2/5 aspect-square glass-panel !bg-surface/50 rounded-2xl flex items-center justify-center p-4">
                                {bundle.thumbnail ? (
                                    <img src={bundle.thumbnail} alt={bundle.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <span className="text-xs font-mono text-muted-foreground">BUNDLE</span>
                                )}
                            </div>
                            <div className="w-full md:w-3/5 flex flex-col h-full">
                                <h3 className="text-2xl font-bold text-foreground mb-2">{bundle.name}</h3>
                                <p className="text-muted-foreground mb-6 line-clamp-3">{bundle.description}</p>

                                <div className="mt-auto flex items-center justify-between">
                                    <div>
                                        <span className="text-2xl font-black text-foreground">₹{bundle.pricePerDay}<span className="text-sm font-normal text-muted-foreground">/day</span></span>
                                    </div>
                                    <Link href={`/gear/${bundle.id}?type=bundle`} className="btn-liquid bg-background border border-surface-border px-6 py-2 rounded-xl font-bold text-sm text-foreground">
                                        <span className="relative z-10">View Bundle</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
