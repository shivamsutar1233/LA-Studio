"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, ChevronRight, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import BundleCard from '@/components/ui/BundleCard';

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
        return <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
    }

    if (bundles.length === 0) return null;

    return (
        <section className="py-12 relative z-10 w-full mb-12">
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full filter blur-[100px] pointer-events-none -z-10"></div>

            <div className="flex justify-between items-end mb-8 px-5">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-[2px] w-6 bg-accent rounded-full"></div>
                        <p className="text-[10px] text-accent uppercase font-black tracking-[0.2em]">Curated Kits</p>
                    </div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight">Pro Bundles</h2>
                </div>
                <Link href="/catalog?tab=bundles" className="bg-surface border border-surface-border px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground active:scale-95 transition-all">
                    All Kits
                </Link>
            </div>

            <div className="relative">
                <div className="flex overflow-x-auto gap-5 px-5 pb-8 no-scrollbar scroll-smooth snap-x snap-mandatory">
                    {loading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="min-w-[300px] bg-surface/30 border border-surface-border/50 rounded-3xl p-5 flex flex-col h-[340px] animate-pulse snap-start">
                                <div className="w-full aspect-square bg-surface-border/30 rounded-2xl mb-4"></div>
                                <div className="h-4 bg-surface-border/30 rounded-md w-3/4 mb-auto"></div>
                                <div className="h-10 bg-surface-border/30 rounded-xl w-full mt-4"></div>
                            </div>
                        ))
                    ) : bundles.length > 0 ? (
                        bundles.map((bundle) => (
                            <div key={bundle.id} className="min-w-[300px] h-[340px] snap-start">
                                <BundleCard {...bundle} />
                            </div>
                        ))
                    ) : (
                        <div className="w-full text-center py-12 text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-50">
                            Bundles arriving soon
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
