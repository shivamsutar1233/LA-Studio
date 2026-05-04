import { motion } from "framer-motion";
import { Clock, CheckCircle, ShoppingCart } from "lucide-react";
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

interface BundleCardProps {
    id: string;
    name: string;
    description: string;
    pricePerDay: number;
    thumbnail?: string;
    gearIds: string; // JSON array of gear IDs
    averageRating?: number;
    reviewCount?: number;
}

export default function BundleCard({ id, name, description, pricePerDay, thumbnail, gearIds, averageRating, reviewCount }: BundleCardProps) {
    const addToCart = useCartStore(state => state.addToCart);
    const gearCount = (() => {
        try {
            return JSON.parse(gearIds).length;
        } catch {
            return 0;
        }
    })();

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();

        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const safeStart = today.toISOString().split('T')[0];
        const safeEnd = tomorrow.toISOString().split('T')[0];

        addToCart({
            gearId: id,
            itemType: 'bundle',
            name: name,
            category: 'Curated Bundle',
            pricePerDay: pricePerDay,
            startDate: safeStart,
            endDate: safeEnd,
            days: 1,
            thumbnail: thumbnail
        });

        toast.success("Added to Cart", { description: `${name} bundle added. You can adjust dates in checkout.` });
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
            className="group relative flex flex-col h-full rounded-3xl border border-surface-border/50 bg-background/60 dark:bg-surface/40 backdrop-blur-2xl backdrop-saturate-[1.8] p-5 transition-all duration-500 hover:border-accent/50 shadow-lg"
        >
            <Link href={`/gear?id=${id}&type=bundle`} className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-surface/50 border border-surface-border/50 mb-4 shadow-inner group/img">
                {/* Category & Status Badges */}
                <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md text-[8px] font-black bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg uppercase tracking-widest leading-none">
                        Bundle
                    </span>
                    {reviewCount && reviewCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[8px] font-black bg-yellow-500/90 backdrop-blur-md text-white shadow-lg w-max flex items-center gap-1 uppercase tracking-widest leading-none">
                            ★ {averageRating?.toFixed(1)}
                        </span>
                    )}
                    {gearCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[8px] font-black bg-accent/90 backdrop-blur-md text-white shadow-lg w-max flex items-center gap-1 uppercase tracking-widest leading-none">
                            <CheckCircle className="h-2 w-2" /> {gearCount} items
                        </span>
                    )}
                </div>

                {/* Thumbnail Image */}
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={name}
                        className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700 ease-in-out"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-surface-border p-4 text-center">
                        <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">{name}</span>
                    </div>
                )}
            </Link>

            <div className="flex flex-col flex-1 relative">
                {/* Content */}
                <div className="flex flex-col flex-1">
                    <p className="text-[10px] font-black text-accent tracking-[0.1em] uppercase mb-1">Curated Kit</p>
                    <Link href={`/gear?id=${id}&type=bundle`} className="block group/title h-5">
                        <h3 className="text-sm font-black text-foreground group-hover/title:text-accent transition-colors truncate leading-tight">
                            {name}
                        </h3>
                    </Link>
                    <p className="text-[10px] text-muted-foreground font-medium line-clamp-1 mt-1 opacity-60">
                        {description}
                    </p>
                </div>

                {/* Price & Action */}
                <div className="pt-4 border-t border-surface-border/50 flex items-center justify-between mt-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1 opacity-60">from</span>
                        <span className="text-lg font-black text-foreground leading-none">₹{pricePerDay}</span>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleQuickAdd}
                            className="group/btn relative flex h-9 w-9 overflow-hidden items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(219,130,24,0.4)] hover:border-accent/50 active:scale-95"
                            aria-label="Quick Add to Cart"
                            title="Quick Add to Cart"
                        >
                            <div className="absolute inset-0 bg-accent translate-y-[101%] group-hover/btn:translate-y-0 transition-transform duration-300 ease-out z-0 rounded-xl"></div>
                            <ShoppingCart className="h-4 w-4 relative z-10 group-hover/btn:text-white transition-colors duration-300" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
