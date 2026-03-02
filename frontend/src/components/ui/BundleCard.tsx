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
}

export default function BundleCard({ id, name, description, pricePerDay, thumbnail, gearIds }: BundleCardProps) {
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
            className="group bg-surface border border-surface-border rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-accent/5 transition-all duration-300 flex flex-col h-full"
        >
            <Link href={`/gear/${id}?type=bundle`} className="relative block h-56 w-full overflow-hidden bg-background group/img">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none"></div>

                {/* Category & Status Badges */}
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg">
                        Curated Bundle
                    </span>
                    {gearCount > 0 && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-accent/90 backdrop-blur-md text-white shadow-lg w-max flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Includes {gearCount} Items
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
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-surface-border">
                        <span className="text-sm font-bold opacity-50">PRO BUNDLE</span>
                    </div>
                )}
            </Link>

            <div className="p-6 flex flex-col flex-1 relative bg-surface">
                {/* Content */}
                <div className="flex-1">
                    <Link href={`/gear/${id}?type=bundle`} className="block group/title">
                        <h3 className="text-xl font-black text-foreground mb-2 group-hover/title:text-accent transition-colors line-clamp-2 leading-tight">
                            {name}
                        </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {description}
                    </p>
                </div>

                {/* Price & Action */}
                <div className="mt-4 pt-4 border-t border-surface-border/50 flex items-center justify-between">
                    <div>
                        <span className="text-2xl font-black text-foreground">₹{pricePerDay}</span>
                        <span className="text-xs text-muted-foreground font-medium ml-1">/ day</span>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleQuickAdd}
                            className="group/btn relative flex h-10 w-10 overflow-hidden items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(219,130,24,0.4)] hover:border-accent/50 active:scale-95"
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
