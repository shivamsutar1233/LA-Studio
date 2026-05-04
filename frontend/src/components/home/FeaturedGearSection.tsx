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
    averageRating?: number;
    reviewCount?: number;
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
                // Fallback or empty state will be handled gracefully by rendering nothing if array is empty
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedGear();
    }, []);

    return (
        <section className="py-24 relative z-10 w-full overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full filter blur-[100px] pointer-events-none -z-10"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">Featured Gear</h2>
                        <p className="text-muted-foreground max-w-2xl text-lg">Top-rated equipment trusted by hundreds of moto vloggers. Ready for your next adventure.</p>
                    </div>
                    <Link href="/catalog" className="text-accent font-bold hover:text-accent-hover flex items-center gap-1 group transition-colors">
                        View All Gear
                        <ChevronRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        // Loading Skeletons
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="glass-panel rounded-3xl p-4 flex flex-col h-[400px] animate-pulse">
                                <div className="w-full h-48 bg-surface-border/50 rounded-2xl mb-4"></div>
                                <div className="h-6 bg-surface-border/50 rounded-md w-3/4 mb-2"></div>
                                <div className="h-4 bg-surface-border/50 rounded-md w-1/2 mb-auto"></div>
                                <div className="mt-4 flex justify-between items-end border-t border-surface-border/50 pt-4">
                                    <div className="h-8 bg-surface-border/50 rounded-md w-1/3"></div>
                                    <div className="h-10 bg-surface-border/50 rounded-xl w-1/3"></div>
                                </div>
                            </div>
                        ))
                    ) : featuredGear.length > 0 ? (
                        featuredGear.map((gear) => (
                            <GearCard key={gear.id} {...gear} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No featured gear available at the moment. Check out our full catalog!
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
