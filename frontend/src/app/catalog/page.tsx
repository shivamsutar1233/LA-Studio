"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import GearCard from "@/components/ui/GearCard";
import BundleCard from "@/components/ui/BundleCard";
import { Package, Aperture } from "lucide-react";
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
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
      {/* Background Refraction Orbs */}
      <div className="absolute top-20 right-[10%] w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-[128px] opacity-20 pointer-events-none -z-10"></div>
      <div className="absolute bottom-20 left-[5%] w-[500px] h-[500px] bg-accent-hover rounded-full mix-blend-multiply filter blur-[128px] opacity-10 pointer-events-none -z-10"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 relative z-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-4">Catalog</h1>
          <div className="flex bg-surface border border-surface-border p-1 rounded-xl w-max mb-4 shadow-sm">
            <button
              onClick={() => handleTabChange('gears')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${entityType === 'gears' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Aperture className="h-4 w-4" /> Individual Gear
            </button>
            <button
              onClick={() => handleTabChange('bundles')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${entityType === 'bundles' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Package className="h-4 w-4" /> Curated Bundles
            </button>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {entityType === 'gears' ? "Browse our professional lineup of action cameras, audio equipment, and mounting solutions specifically tested for moto vlogging." : "Rent our complete, ready-to-shoot curated kits containing everything you need for your next adventure."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="px-4 py-2 rounded-lg border border-surface-border bg-surface text-sm font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-accent hover:cursor-pointer"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option>Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Category Pills - Only show for Gears */}
      {entityType === 'gears' && (
        <div className="glass-panel rounded-2xl p-2 flex overflow-x-auto gap-3 pb-2 mb-8 scrollbar-hide shrink-0 w-full md:w-fit">
          {["All Gear", "Camera", "Audio", "Mounts", "Accessories"].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeCategory === cat
                ? 'btn-liquid bg-accent text-white shadow-lg shadow-accent/20'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-surface/50'
                }`}
            >
              <span className="relative z-10">{cat === "Camera" ? "Cameras" : cat}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-surface border border-surface-border rounded-2xl overflow-hidden flex flex-col">
              {/* Thumbnail skeleton */}
              <div className="w-full aspect-[4/3] bg-surface-border/60 animate-pulse" />
              {/* Content skeleton */}
              <div className="p-4 flex flex-col gap-3 flex-1">
                {/* Category badge */}
                <div className="h-5 w-20 bg-surface-border/60 rounded-full animate-pulse" />
                {/* Title */}
                <div className="h-5 w-3/4 bg-surface-border/60 rounded-lg animate-pulse" />
                {/* Price + button row */}
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div className="h-6 w-24 bg-surface-border/60 rounded-lg animate-pulse" />
                  <div className="h-9 w-28 bg-surface-border/40 rounded-xl animate-pulse" />
                </div>
              </div>
            </div>
          ))
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">No items found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search criteria.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            entityType === 'gears'
              ? <GearCard key={item.id} {...item as GearParams} />
              : <BundleCard key={item.id} {...item} />
          ))
        )}
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-surface border border-surface-border rounded-2xl overflow-hidden flex flex-col"><div className="w-full aspect-[4/3] bg-surface-border/60 animate-pulse" /><div className="p-4 flex flex-col gap-3"><div className="h-5 w-20 bg-surface-border/60 rounded-full animate-pulse" /><div className="h-5 w-3/4 bg-surface-border/60 rounded-lg animate-pulse" /></div></div>)}</div>}>
      <CatalogContent />
    </Suspense>
  );
}
