"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import GearCard from "@/components/ui/GearCard";
import { Filter, Loader2 } from "lucide-react";
import api from '@/lib/api';
import { useSearchParams } from 'next/navigation';

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
  const categoryParam = searchParams.get('category');

  const [activeCategory, setActiveCategory] = useState("All Gear");
  const [sortOrder, setSortOrder] = useState("Featured");
  const [gearItems, setGearItems] = useState<GearParams[]>([]);
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
    const fetchGear = async () => {
      try {
        const response = await api.get('/api/gears');
        setGearItems(response.data);
      } catch (error) {
        console.error("Error fetching gear:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGear();
  }, []);

  const filteredGear = useMemo(() => {
    let result = [...gearItems];
    if (activeCategory !== "All Gear") {
      result = result.filter(g => g.category === activeCategory);
    }
    
    switch (sortOrder) {
      case "Price: Low to High":
        result.sort((a, b) => a.pricePerDay - b.pricePerDay);
        break;
      case "Price: High to Low":
        result.sort((a, b) => b.pricePerDay - a.pricePerDay);
        break;
      case "Highest Rated":
        // Mock rating sort since all have 4.9 in MVP
        break;
      default:
        // Featured
        break;
    }
    return result;
  }, [activeCategory, sortOrder, gearItems]);

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
      {/* Background Refraction Orbs */}
      <div className="absolute top-20 right-[10%] w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse pointer-events-none -z-10"></div>
      <div className="absolute bottom-20 left-[5%] w-[500px] h-[500px] bg-accent-hover rounded-full mix-blend-multiply filter blur-[128px] opacity-10 pointer-events-none -z-10"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 relative z-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">Gear Catalog</h1>
          <p className="text-muted-foreground max-w-2xl">Browse our professional lineup of action cameras, audio equipment, and mounting solutions specifically tested for moto vlogging.</p>
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

      {/* Category Pills */}
      <div className="flex overflow-x-auto gap-3 pb-4 mb-8 scrollbar-hide shrink-0 w-full">
        {["All Gear", "Camera", "Audio", "Mounts", "Accessories"].map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-accent text-white' : 'bg-surface border border-surface-border hover:border-gray-500 text-foreground'}`}
          >
            {cat === "Camera" ? "Cameras" : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          filteredGear.map(gear => (
            <GearCard key={gear.id} {...gear} />
          ))
        )}
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 flex justify-center w-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <CatalogContent />
    </Suspense>
  );
}
