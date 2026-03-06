"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import GearCard from "@/components/ui/GearCard";
import BundleCard from "@/components/ui/BundleCard";
import { Package, Aperture, ChevronRight } from "lucide-react";
import api from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';

interface GearParams {
  id: string;
  name: string;
  category: string;
  pricePerDay: number;
  thumbnail?: string;
  images?: string;
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category');

  const initialTab = (searchParams.get('tab') as 'gears' | 'bundles') || 'gears';
  const [entityType, setEntityType] = useState<'gears' | 'bundles'>(initialTab);

  const handleTabChange = (tab: 'gears' | 'bundles') => {
    setEntityType(tab);

    // Create new URLSearchParams string to preserve other parameters like category
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('tab', tab);

    // Preserve existing category param if switching gears -> gears or if user wants bundle but had a category active
    // If switching to bundles, maybe we should clear the category since bundles don't have them in the same way? 
    // For now, let's keep it simple and just set the tab.
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`/catalog${query}`);
  };

  const [activeCategory, setActiveCategory] = useState("All Gear");
  const [sortOrder, setSortOrder] = useState("Featured");
  const [gearItems, setGearItems] = useState<GearParams[]>([]);
  const [bundleItems, setBundleItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryParam) {
      const catMap: Record<string, string> = {
        'camera': 'Camera',
        'audio': 'Audio',
        'mount': 'Mounts',
        'accessories': 'Accessories'
      };
      const cat = catMap[categoryParam.toLowerCase()];
      if (cat) {
        setActiveCategory(cat);
      }
    } else {
      setActiveCategory("All Gear");
    }
  }, [categoryParam]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gearsRes, bundlesRes] = await Promise.all([
          api.get('/api/gears'),
          api.get('/api/bundles')
        ]);
        setGearItems(gearsRes.data);
        setBundleItems(bundlesRes.data);
      } catch (error) {
        console.error("Error fetching catalog data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    let result = entityType === 'gears' ? [...gearItems] : [...bundleItems];

    if (entityType === 'gears' && activeCategory !== "All Gear") {
      result = (result as GearParams[]).filter(g => g.category === activeCategory);
    }

    switch (sortOrder) {
      case "Price: Low to High":
        result.sort((a, b) => a.pricePerDay - b.pricePerDay);
        break;
      case "Price: High to Low":
        result.sort((a, b) => b.pricePerDay - a.pricePerDay);
        break;
      case "Highest Rated":
      default:
        break;
    }
    return result;
  }, [entityType, activeCategory, sortOrder, gearItems, bundleItems]);

  return (
    <div className="relative w-full py-8 pb-24">
      {/* Subtle Background Refraction */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-accent rounded-full filter blur-[100px] opacity-10 pointer-events-none -z-10"></div>

      <div className="flex flex-col mb-10 px-1">
        <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">Catalog</h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-[280px] leading-snug font-medium">
          Professional gear for riders who never settle for the standard angle.
        </p>

        <div className="flex bg-surface border border-surface-border p-1.5 rounded-2xl w-full mb-8 shadow-sm overflow-hidden">
          <button
            onClick={() => handleTabChange('gears')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-300 ${entityType === 'gears' ? 'bg-background shadow-lg text-foreground' : 'text-muted-foreground'}`}
          >
            <Aperture className={`h-4 w-4 ${entityType === 'gears' ? 'text-accent' : ''}`} /> Individual Gear
          </button>
          <button
            onClick={() => handleTabChange('bundles')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-300 ${entityType === 'bundles' ? 'bg-background shadow-lg text-foreground' : 'text-muted-foreground'}`}
          >
            <Package className={`h-4 w-4 ${entityType === 'bundles' ? 'text-accent' : ''}`} /> Bundles
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-1">
              {entityType === 'gears' ? "Action Ready" : "Complete Kits"}
            </p>
            <p className="text-xs font-bold text-muted-foreground">
              {filteredItems.length} {entityType === 'gears' ? "Items" : "Kits"} Available
            </p>
          </div>
          <div className="relative group">
            <select
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-surface-border bg-surface text-[10px] font-black uppercase tracking-widest text-foreground focus:outline-none focus:border-accent transition-all active:scale-95"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option>Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <ChevronRight className="h-3 w-3 rotate-90" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills - Simplified for Touch */}
      {entityType === 'gears' && (
        <div className="flex overflow-x-auto gap-3 pb-8 mb-2 no-scrollbar -mx-1 px-1">
          {["All Gear", "Camera", "Audio", "Mounts", "Accessories"].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 active:scale-90 ${activeCategory === cat
                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                : 'bg-surface border border-surface-border text-muted-foreground'
                }`}
            >
              {cat === "Camera" ? "Cameras" : cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 pb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface/30 border border-surface-border/50 rounded-3xl p-5 flex flex-col h-[320px] animate-pulse">
              <div className="w-full aspect-square bg-surface-border/30 rounded-2xl mb-4"></div>
              <div className="h-4 bg-surface-border/30 rounded-md w-3/4 mb-auto"></div>
              <div className="h-10 bg-surface-border/30 rounded-xl w-full mt-4"></div>
            </div>
          ))
        ) : filteredItems.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-surface/30 rounded-[2.5rem] border border-dashed border-surface-border">
            <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-black text-foreground mb-1 uppercase tracking-tight">No items found</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Try a different category</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {entityType === 'gears'
                ? <GearCard {...item as GearParams} />
                : <BundleCard {...item} />}
            </div>
          ))
        )}
      </div>
    </div>


  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-surface border border-surface-border rounded-3xl h-[320px] animate-pulse" />)}</div>}>
      <CatalogContent />
    </Suspense>
  );
}

