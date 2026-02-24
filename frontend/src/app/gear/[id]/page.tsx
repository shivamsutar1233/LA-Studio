"use client";

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { ShieldCheck, CheckCircle2, Star, ArrowLeft, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { differenceInDays, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface GearDetail {
  id: string;
  name: string;
  category: string;
  pricePerDay: number;
  thumbnail?: string;
  images?: string;
  description?: string;
  features?: string[];
  includes?: string[];
}

export default function GearDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [gear, setGear] = useState<GearDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState(0);

  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    if (!id) return;
    const fetchGear = async () => {
      try {
        const response = await api.get(`/api/gears/${id}`);
        setGear(response.data);
        if (response.data.thumbnail) {
          setSelectedImage(response.data.thumbnail);
        }
      } catch (error) {
        console.error("Error fetching gear details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGear();
  }, [id]);

  useEffect(() => {
    if (startDate && endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const diff = differenceInDays(end, start);
      setDays(diff > 0 ? diff : 0);
    } else {
      setDays(0);
    }
  }, [startDate, endDate]);

  const handleAddToCart = () => {
    if (!gear) return;
    if (days <= 0) {
      toast.error("Invalid Dates", { description: "Please select valid rental dates (at least 1 day)." });
      return;
    }
    
    addToCart({
      gearId: gear.id,
      name: gear.name,
      category: gear.category,
      pricePerDay: gear.pricePerDay,
      startDate,
      endDate,
      days
    });
    
    toast.success("Added to Cart", { description: `${gear.name} has been added to your rental cart.` });
    router.push('/cart');
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-24 text-center text-muted-foreground">Loading gear details...</div>;
  }

  if (!gear) {
    return <div className="max-w-7xl mx-auto px-4 py-24 text-center text-muted-foreground">Gear not found.</div>;
  }

  // Fallback data for properties not fully modelled in MVP backend yet
  const description = gear.description || 'Professional grade equipment verified and tested for moto vlogging.';
  const features = gear.features || ['Premium Quality', 'Tested for Moto Vlogging', 'Sanitized before rental', 'Fully Charged'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <Link href="/catalog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" />
        Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Images Column */}
        <div className="flex flex-col gap-4">
          <div className="aspect-square w-full rounded-2xl bg-surface border border-surface-border flex items-center justify-center relative overflow-hidden group">
            {selectedImage ? (
              <img src={selectedImage} alt={gear.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <div className="text-muted-foreground font-mono text-xl group-hover:scale-110 transition-transform duration-500 text-center px-4">
                IMAGE: <br/>{gear.name}
              </div>
            )}
            {gear.category === 'Camera' && (
              <div className="absolute top-4 right-4 bg-surface-foreground/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-bold text-background border border-surface-border">
                Premium Quality
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {/* Always show the thumbnail as the first option if it exists */}
            {gear.thumbnail && (
              <div 
                onClick={() => setSelectedImage(gear.thumbnail!)}
                className={`aspect-square rounded-xl bg-surface border flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-accent ${selectedImage === gear.thumbnail ? 'border-accent ring-2 ring-accent/50 opacity-100' : 'border-surface-border opacity-70 hover:opacity-100'}`}
              >
                <img src={gear.thumbnail} alt="Main Thumbnail" className="h-full w-full object-cover" />
              </div>
            )}
            
            {/* Show remaining gallery images */}
            {gear.images && gear.images !== '[]' && (
              JSON.parse(gear.images).map((imgUrl: string, idx: number) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`aspect-square rounded-xl bg-surface border flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-accent ${selectedImage === imgUrl ? 'border-accent ring-2 ring-accent/50 opacity-100' : 'border-surface-border opacity-70 hover:opacity-100'}`}
                >
                  <img src={imgUrl} alt={`Gallery ${idx}`} className="h-full w-full object-cover" />
                </div>
              ))
            )}
            
             {/* Show placeholders if absolutely no images exist */}
            {!gear.thumbnail && (!gear.images || gear.images === '[]') && (
              [1, 2, 3].map(i => (
                <div key={i} className="aspect-square rounded-xl bg-surface border border-surface-border flex items-center justify-center text-xs text-muted-foreground font-mono hover:border-accent cursor-pointer transition-colors">
                  THUMB {i}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Details Column */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 rounded-full">
              {gear.category}
            </span>
            <div className="flex items-center text-yellow-500 text-sm font-bold gap-1">
              <Star className="h-4 w-4 fill-current" /> 4.9 (128 reviews)
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
            {gear.name}
          </h1>
          
          <div className="flex items-end gap-2 mb-8">
            <span className="text-5xl font-black text-foreground">₹{gear.pricePerDay}</span>
            <span className="text-muted-foreground mb-2 font-medium">/ day</span>
          </div>
          
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            {description}
          </p>

          <div className="bg-surface border border-surface-border p-6 rounded-2xl mb-8">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent" /> Guaranteed Condition
            </h3>
            <p className="text-sm text-muted-foreground">All equipment is tested, sanitized, and fully charged before every rental. Memory cards are formatted and ready to shoot.</p>
          </div>

          <div className="space-y-6 mb-10">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">Key Features</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Area: Date Picker & Add to Cart */}
          <div className="mt-auto border-t border-surface-border pt-8">
            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface text-foreground focus:ring-accent focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface text-foreground focus:ring-accent focus:border-accent"
                />
              </div>
            </div>

            {days > 0 && (
              <div className="flex justify-between items-center mb-6 px-4 py-3 bg-accent/10 rounded-xl text-accent font-medium">
                <span>{days} Day Rental</span>
                <span>Total: ₹{(gear.pricePerDay * days).toFixed(2)}</span>
              </div>
            )}

            <button 
              onClick={handleAddToCart}
              className={`w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.98] shadow-lg ${
                days > 0 ? 'bg-accent text-white hover:bg-accent-hover shadow-accent/20' : 'bg-surface-border text-muted-foreground cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              {days > 0 ? 'Add to Rental Cart' : 'Select Dates to Rent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
