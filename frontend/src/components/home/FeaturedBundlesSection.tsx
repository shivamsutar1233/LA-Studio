"use client";

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
                        <BundleCard key={bundle.id} {...bundle} />
                    ))}
                </div>
            </div>
        </section>
    );
}
