"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Loader2, Package, Hash, CalendarRange, MapPin, CheckCircle, Clock, RotateCcw, PenIcon, IndianRupee } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface BookingDetails {
  id: string;
  gearIds: string;
  bundleIds?: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  undertakingSigned: number;
  aadhaarNumber?: string;
  aadhaarUrl?: string;
  refundStatus?: string | null;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  } | null;
}

interface GearMap {
  [key: string]: { name: string; thumbnail?: string; pricePerDay: number };
}

function BookingDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');
  
  const { token, user } = useAuthStore();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [gearInfo, setGearInfo] = useState<GearMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    if (!bookingId) {
      router.push('/dashboard');
      return;
    }

    const fetchDetails = async () => {
      try {
        const [bookingRes, gearsRes, bundlesRes] = await Promise.all([
          api.get(`/api/bookings/${bookingId}`, { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/api/gears'),
          api.get('/api/bundles')
        ]);

        setBooking(bookingRes.data);

        const gearMap: GearMap = {};
        if (Array.isArray(gearsRes.data)) {
          gearsRes.data.forEach((g: any) => {
            gearMap[g.id] = { name: g.name, thumbnail: g.thumbnail, pricePerDay: g.pricePerDay };
          });
        }
        if (Array.isArray(bundlesRes.data)) {
          bundlesRes.data.forEach((b: any) => {
            gearMap[b.id] = { name: b.name, thumbnail: b.thumbnail, pricePerDay: b.pricePerDay };
          });
        }
        setGearInfo(gearMap);

      } catch (error) {
        console.error("Failed to load booking details", error);
        toast.error("Booking not found");
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [bookingId, token, user, router]);

  const handleCancelBooking = async () => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await api.put(`/api/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Booking cancelled successfully.");
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel booking.");
    }
  };

  if (loading || !booking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Extract all items for display
  let allItems: any[] = [];
  try {
    if (booking.gearIds) {
      const gIds = JSON.parse(booking.gearIds);
      if (Array.isArray(gIds)) allItems = [...allItems, ...gIds];
    }
  } catch { allItems.push(booking.gearIds); }
  
  try {
    if (booking.bundleIds) {
      const bIds = JSON.parse(booking.bundleIds);
      if (Array.isArray(bIds)) allItems = [...allItems, ...bIds];
    }
  } catch {}

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    confirmed: 'bg-green-500/10 text-green-500 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const statusColor = statusColors[booking.status as keyof typeof statusColors] || statusColors.pending;

  // Pricing calculations
  const rentalDays = Math.max(differenceInDays(parseISO(booking.endDate), parseISO(booking.startDate)), 1);
  let subtotal = 0;
  
  const processedItems = allItems.map((item: any) => {
    const isString = typeof item === 'string';
    const name = isString ? (gearInfo[item]?.name || 'Unknown Item') : (item.name || 'Unknown Item');
    const thumbnail = isString ? gearInfo[item]?.thumbnail : undefined;
    const qty = !isString && item.quantity > 1 ? item.quantity : 1;
    const pricePerDay = isString ? (gearInfo[item]?.pricePerDay || 0) : (item.pricePerDay || 0);
    const itemTotal = pricePerDay * rentalDays * qty;
    
    subtotal += itemTotal;
    
    return { name, thumbnail, qty, pricePerDay, itemTotal };
  });

  const deposit = processedItems.length > 0 ? 150 : 0;
  const totalPrice = subtotal + deposit;

  return (
    <div className="flex flex-col min-h-screen pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-surface-border p-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')} className="p-2 bg-surface border border-surface-border rounded-full text-foreground hover:text-accent disabled:opacity-50">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-black text-lg text-foreground">Booking Details</span>
      </div>

      <div className="p-4 space-y-6">
        {/* Status Card */}
        <div className="bg-surface border border-surface-border rounded-3xl p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-mono font-bold text-foreground">
                {booking.id}
              </span>
            </div>
            <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusColor}`}>
              {booking.status}
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-foreground mb-2">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold">{new Date(booking.startDate).toLocaleDateString()} to {new Date(booking.endDate).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Placed on {new Date(booking.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Required (Undertaking) */}
        {booking.status === 'confirmed' && booking.undertakingSigned !== 1 && (
          <div className="bg-accent/10 border border-accent/20 rounded-3xl p-5 flex flex-col items-start gap-3">
             <div className="flex items-center gap-2 text-accent font-black">
               <PenIcon className="h-5 w-5" />
               <span>Action Required</span>
             </div>
             <p className="text-xs text-muted-foreground font-medium">Please sign the digital undertaking to proceed with your rental.</p>
             <button onClick={() => router.push(`/dashboard/user/undertaking?id=${booking.id}`)} className="w-full bg-accent text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-accent/20 hover:scale-[1.02] transition-transform">
               Sign Document
             </button>
          </div>
        )}

        {/* Order Items */}
        <div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider mb-3 ml-1">Items Rented</h3>
          <div className="space-y-3">
            {processedItems.map((item: any, i: number) => (
                <div key={i} className="flex gap-4 bg-surface border border-surface-border p-3 rounded-2xl items-center">
                   <div className="w-16 h-16 bg-background rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-surface-border">
                     {item.thumbnail ? (
                       <img src={item.thumbnail} alt={item.name} className="w-full h-full object-contain p-2" />
                     ) : (
                       <Package className="h-6 w-6 text-muted-foreground" />
                     )}
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="font-bold text-foreground text-sm truncate">{item.name}</p>
                     <p className="text-xs text-muted-foreground mt-1">Qty: {item.qty} • ₹{item.pricePerDay}/day</p>
                   </div>
                   <div className="text-right">
                     <p className="font-bold text-sm text-foreground">₹{item.itemTotal}</p>
                   </div>
                </div>
            ))}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="bg-surface border border-surface-border rounded-3xl p-5 space-y-4">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
            <IndianRupee className="h-4 w-4 text-accent" /> Payment Summary
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Rental Fee ({rentalDays} {rentalDays === 1 ? 'day' : 'days'})</span>
              <span className="font-medium text-foreground">₹{subtotal}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Security Deposit (Refundable)</span>
              <span className="font-medium text-foreground">₹{deposit}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-surface-border/50">
              <span className="font-black text-foreground">Total Paid</span>
              <span className="font-black text-accent text-lg">₹{totalPrice}</span>
            </div>
          </div>
        </div>

        {/* Details List */}
        <div className="bg-surface border border-surface-border rounded-3xl p-5 space-y-4 text-sm">
          {booking.deliveryAddress && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-foreground text-xs uppercase tracking-wider mb-1">Delivery Address</p>
                <p className="text-muted-foreground">{booking.deliveryAddress.street}</p>
                <p className="text-muted-foreground">{booking.deliveryAddress.city}, {booking.deliveryAddress.state} {booking.deliveryAddress.zip}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-surface-border/50 pt-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground text-xs uppercase tracking-wider">Undertaking</span>
              <span className={`flex items-center gap-1 text-xs font-bold ${booking.undertakingSigned === 1 ? 'text-green-500' : 'text-yellow-500'}`}>
                {booking.undertakingSigned === 1 ? <><CheckCircle className="h-3 w-3" /> Signed</> : <><Clock className="h-3 w-3" /> Pending</>}
              </span>
            </div>
            {booking.undertakingSigned === 1 && (
              <div className="bg-background rounded-2xl p-4 border border-surface-border space-y-3 mt-2">
                {booking.aadhaarNumber && (
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-muted-foreground font-bold uppercase tracking-wider">Aadhaar No.</span>
                     <span className="font-mono text-foreground font-medium">XXXX-XXXX-{booking.aadhaarNumber.slice(-4)}</span>
                   </div>
                )}
                
                {booking.aadhaarUrl && (
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-surface-border/50">
                    <span className="text-muted-foreground font-bold uppercase tracking-wider">ID Document</span>
                    <a 
                      href={booking.aadhaarUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-accent hover:underline font-bold"
                    >
                      View Document
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {booking.refundStatus && (
            <div className="flex items-center justify-between border-t border-surface-border/50 pt-4">
              <span className="font-bold text-foreground text-xs uppercase tracking-wider">Refund Status</span>
              <span className="flex items-center gap-1 text-xs font-bold text-orange-500 uppercase">
                <RotateCcw className="h-3 w-3" /> {booking.refundStatus}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {(booking.status === 'pending' || booking.status === 'confirmed') && (
          <div className="pt-4">
            <button onClick={handleCancelBooking} className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-4 rounded-xl font-bold text-sm hover:bg-red-500 hover:text-white transition-colors">
              Cancel Booking
            </button>
            <p className="text-center text-[10px] text-muted-foreground mt-3 px-4">Cancelling a confirmed booking may be subject to cancellation fees as per our refund policy.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserBookingDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>}>
      <BookingDetailsContent />
    </Suspense>
  )
}
