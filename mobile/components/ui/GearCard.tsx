"use client";

import Link from 'next/link';
import { ShoppingCart, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

interface GearParams {
  id: string;
  name: string;
  category: string;
  pricePerDay: number;
  thumbnail?: string;
  averageRating?: number;
  reviewCount?: number;
}

export default function GearCard({ id, name, category, pricePerDay, thumbnail, averageRating, reviewCount }: GearParams) {
  const router = useRouter();
  const addToCart = useCartStore(state => state.addToCart);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation if click occurs inside link

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    addToCart({
      gearId: id,
      name,
      category,
      pricePerDay,
      startDate: today.toISOString().split('T')[0],
      endDate: tomorrow.toISOString().split('T')[0],
      days: 1,
      thumbnail
    });

    toast.success("Added to Cart", { description: `${name} added. You can adjust dates in checkout.` });
  };

  return (
    <div className="group relative flex flex-col h-full rounded-3xl border border-surface-border/50 bg-background/60 dark:bg-surface/40 backdrop-blur-2xl backdrop-saturate-[1.8] p-5 transition-all duration-500 hover:-translate-y-2 hover:border-accent/50 hover:bg-background/80 dark:hover:bg-surface/60 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_20px_40px_-10px_rgba(219,130,24,0.15)] shadow-lg hover:ring-1 hover:ring-accent/20">
      {/* Image Placeholder */}
      <Link href={`/gear?id=${id}`} className="block relative aspect-square w-full overflow-hidden rounded-2xl bg-surface/50 border border-surface-border/50 mb-4 shadow-inner">
        {thumbnail ? (
          <img src={thumbnail} alt={name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono text-xs group-hover:scale-110 transition-transform duration-700 ease-out bg-surface/30 px-4 text-center">
            {name}
          </div>
        )}
        {category === 'Camera' && (
          <div className="absolute top-2 right-2 bg-surface-foreground/60 backdrop-blur-md px-2 py-1 rounded-md text-[8px] font-black text-background border border-surface-border uppercase tracking-widest">
            4K 60fps
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[10px] font-black text-accent tracking-[0.1em] uppercase">{category}</p>
          <div className="flex items-center text-yellow-500 text-[10px] font-black gap-1">
            <Star className="h-3 w-3 fill-current" /> {reviewCount && reviewCount > 0 ? averageRating?.toFixed(1) : 'New'}
          </div>
        </div>

        <Link href={`/gear?id=${id}`} className="text-sm font-black text-foreground leading-tight truncate hover:text-accent transition-colors block h-5">
          {name}
        </Link>

        <div className="pt-4 flex items-center justify-between border-t border-surface-border/50 mt-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1 opacity-60">from</span>
            <span className="text-lg font-black text-foreground leading-none">₹{pricePerDay}<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">/d</span></span>
          </div>

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
  );
}
