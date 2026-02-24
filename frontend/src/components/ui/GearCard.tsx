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
}

export default function GearCard({ id, name, category, pricePerDay, thumbnail }: GearParams) {
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
      days: 1
    });

    toast.success("Added to Cart", { description: `${name} added. You can adjust dates in checkout.` });
  };

  return (
    <div className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-3xl p-4 transition-all hover:border-accent/50 hover:bg-white/10 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] shadow-[0_4px_16px_0_rgba(0,0,0,0.2)]">
      {/* Image Placeholder */}
      <Link href={`/gear/${id}`} className="block relative aspect-square w-full overflow-hidden rounded-xl bg-background border border-surface-border/50 mb-4">
        {thumbnail ? (
          <img src={thumbnail} alt={name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono text-sm group-hover:scale-110 transition-transform duration-500">
            IMAGE: {name}
          </div>
        )}
        {category === 'Camera' && (
          <div className="absolute top-2 right-2 bg-surface-foreground/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-semibold text-background border border-surface-border">
            4K 60fps
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-medium text-accent tracking-wider uppercase">{category}</p>
          <div className="flex items-center text-yellow-500 text-xs font-bold gap-1">
            <Star className="h-3 w-3 fill-current" /> 4.9
          </div>
        </div>
        
        <Link href={`/gear/${id}`} className="text-lg font-bold text-foreground leading-tight mb-2 hover:text-accent transition-colors line-clamp-2">
          {name}
        </Link>
        
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-surface-border">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">from</span>
            <span className="text-xl font-bold text-foreground">₹{pricePerDay}<span className="text-sm font-normal text-muted-foreground">/day</span></span>
          </div>
          
          <button 
            onClick={handleQuickAdd}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors hover:bg-accent hover:text-white" 
            aria-label="Quick Add to Cart"
            title="Quick Add to Cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
