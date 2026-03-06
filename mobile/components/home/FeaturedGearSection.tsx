'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import GearCard from '@/components/ui/GearCard';
import api from '@/lib/api';

interface Gear {
    id: string;
    name: string;
    category: string;
    pricePerDay: number;
    thumbnail: string;
}

export default function FeaturedGearSection() {
    const [featuredGear, setFeaturedGear] = useState<Gear[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeaturedGear = async () => {
            try {
                const response = await api.get('/api/gears/featured');
                setFeaturedGear(response.data);
            } catch (error) {
                console.error('Failed to fetch featured gear:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedGear();
    }, []);

    return (
        <section className="py-12 relative z-10 w-full overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full filter blur-[100px] pointer-events-none -z-10"></div>

            <div className="flex justify-between items-end mb-8 px-5">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-[2px] w-6 bg-accent rounded-full"></div>
                        <p className="text-[10px] text-accent uppercase font-black tracking-[0.2em]">Curated</p>
                    </div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight">Top Gear</h2>
                </div>
                <Link href="/catalog" className="bg-surface border border-surface-border px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground active:scale-95 transition-all">
                    View All
                </Link>
            </div>

            <div className="relative">
                <div className="flex overflow-x-auto gap-5 px-5 pb-8 no-scrollbar scroll-smooth snap-x snap-mandatory">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="min-w-[280px] bg-surface/30 border border-surface-border/50 rounded-3xl p-5 flex flex-col h-[340px] animate-pulse snap-start">
                                <div className="w-full aspect-square bg-surface-border/30 rounded-2xl mb-4"></div>
                                <div className="h-4 bg-surface-border/30 rounded-md w-3/4 mb-auto"></div>
                                <div className="h-10 bg-surface-border/30 rounded-xl w-full mt-4"></div>
                            </div>
                        ))
                    ) : featuredGear.length > 0 ? (
                        featuredGear.map((gear) => (
                            <div key={gear.id} className="min-w-[280px] h-[340px] snap-start">
                                <GearCard {...gear} />
                            </div>
                        ))
                    ) : (
                        <div className="w-full text-center py-12 text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-50">
                            Available soon
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
