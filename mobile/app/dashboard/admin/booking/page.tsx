"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Loader2, Package, Hash, CalendarRange, MapPin, CheckCircle, Clock, RotateCcw, User as UserIcon, XCircle, IndianRupee } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface AdminBookingDetails {
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
  customer: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  } | null;
}

interface CatalogMap {
  [key: string]: { name: string; thumbnail?: string; pricePerDay: number, type: 'gear' | 'bundle' };
}

function AdminBookingDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');

  const { token, user } = useAuthStore();
  const [booking, setBooking] = useState<AdminBookingDetails | null>(null);
  const [catalogInfo, setCatalogInfo] = useState<CatalogMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/auth/login');
      return;
    }
    
    if (!bookingId) {
      router.push('/dashboard/admin');
      return;
    }

    const fetchDetails = async () => {
      try {
        const [bookingRes, gearsRes, bundlesRes] = await Promise.all([
          api.get(`/api/admin/bookings/${bookingId}`, { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/api/gears'),
          api.get('/api/bundles')
        ]);

        setBooking(bookingRes.data);

        const catMap: CatalogMap = {};
        if (Array.isArray(gearsRes.data)) {
          gearsRes.data.forEach((g: any) => {
            catMap[g.id] = { name: g.name, thumbnail: g.thumbnail, pricePerDay: g.pricePerDay, type: 'gear' };
          });
        }
        if (Array.isArray(bundlesRes.data)) {
          bundlesRes.data.forEach((b: any) => {
            catMap[b.id] = { name: b.name, thumbnail: b.thumbnail, pricePerDay: b.pricePerDay, type: 'bundle' };
          });
        }
        setCatalogInfo(catMap);

      } catch (error) {
        console.error("Failed to load booking details", error);
        toast.error("Booking not found");
        router.push('/dashboard/admin');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [bookingId, token, user, router]);

  const updateBookingStatus = async (newStatus: string) => {
    try {
      await api.put(`/api/admin/bookings/${bookingId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Booking marked as ${newStatus}`);
      setBooking((prev) => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error("Error updating booking status", error);
      toast.error("Failed to update status");
    }
  };

  const processRefund = async () => {
    if (!window.confirm("Are you sure you want to mark this refund as processed?")) return;
    try {
      await api.put(`/api/admin/bookings/${bookingId}/refund`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Refund marked as processed");
      setBooking((prev) => prev ? { ...prev, refundStatus: 'processed' } : null);
    } catch (error) {
      console.error("Error processing refund", error);
      toast.error("Failed to process refund");
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
    const name = isString ? (catalogInfo[item]?.name || 'Unknown Item') : (item.name || 'Unknown Item');
    const thumbnail = isString ? catalogInfo[item]?.thumbnail : undefined;
    const qty = !isString && item.quantity > 1 ? item.quantity : 1;
    const type = isString ? catalogInfo[item]?.type : 'item';
    const pricePerDay = isString ? (catalogInfo[item]?.pricePerDay || 0) : (item.pricePerDay || 0);
    const itemTotal = pricePerDay * rentalDays * qty;
    
    subtotal += itemTotal;
    
    return { name, thumbnail, qty, type, pricePerDay, itemTotal };
  });

  const deposit = processedItems.length > 0 ? 150 : 0;
  const totalPrice = subtotal + deposit;

  return (
    <div className="flex flex-col min-h-screen pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-surface-border p-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard/admin')} className="p-2 bg-surface border border-surface-border rounded-full text-foreground hover:text-accent disabled:opacity-50">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-black text-lg text-foreground">Manage Booking</span>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Action Panel if Pending */}
        {booking.status === 'pending' && (
          <div className="flex flex-col gap-3">
            <button onClick={() => updateBookingStatus('confirmed')} className="w-full bg-green-500/10 text-green-500 border border-green-500/20 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-500 hover:text-white transition-colors">
              <CheckCircle className="h-5 w-5" /> Accept Booking
            </button>
            <button onClick={() => updateBookingStatus('rejected')} className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-colors">
              <XCircle className="h-5 w-5" /> Reject Booking
            </button>
          </div>
        )}

        {/* Action Panel if Pending Refund */}
        {booking.refundStatus === 'pending' && (
          <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-3xl">
            <p className="text-orange-500 font-black text-sm mb-4 flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Refund Requested
            </p>
            <button onClick={() => processRefund()} className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors">
               Mark Refund Processed
            </button>
          </div>
        )}

        {/* Status Card */}
        <div className="bg-surface border border-surface-border rounded-3xl p-5">
          <div className="flex justify-between items-center mb-5 border-b border-surface-border/50 pb-5">
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
          
          <div className="flex items-start gap-4 mb-4 text-sm text-foreground">
            <UserIcon className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div className="min-w-0">
               <p className="font-bold text-foreground">{booking.customer?.name || 'Guest'}</p>
               <p className="text-xs text-muted-foreground truncate">{booking.customer?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-foreground mb-3">
            <CalendarRange className="h-5 w-5 text-accent shrink-0" />
            <span className="font-bold">{new Date(booking.startDate).toLocaleDateString()} to {new Date(booking.endDate).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Clock className="h-5 w-5 shrink-0" />
            <span>Placed on {new Date(booking.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Details List */}
        <div className="bg-surface border border-surface-border rounded-3xl p-5 space-y-4 text-sm">
          {booking.deliveryAddress && (
            <div className="flex items-start gap-4">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-foreground text-xs uppercase tracking-wider mb-1">Delivery Address</p>
                <p className="text-muted-foreground font-medium">{booking.deliveryAddress.street}</p>
                <p className="text-muted-foreground font-medium">{booking.deliveryAddress.city}, {booking.deliveryAddress.state} {booking.deliveryAddress.zip}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-surface-border/50 pt-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground text-xs uppercase tracking-wider">Undertaking</span>
              <span className={`flex items-center gap-1 text-xs font-bold ${booking.undertakingSigned === 1 ? 'text-green-500' : 'text-yellow-500'}`}>
                {booking.undertakingSigned === 1 ? <><CheckCircle className="h-3 w-3" /> Signed</> : <><Clock className="h-3 w-3" /> Pending Signature</>}
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
              <span className={`flex items-center gap-1 text-xs font-bold uppercase ${booking.refundStatus === 'processed' ? 'text-green-500' : 'text-orange-500'}`}>
                <RotateCcw className="h-3 w-3" /> {booking.refundStatus}
              </span>
            </div>
          )}
        </div>

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
                     <div className="flex items-start justify-between">
                       <p className="font-bold text-foreground text-sm truncate pr-2">{item.name}</p>
                       <span className="shrink-0 text-[8px] bg-background border border-surface-border px-2 py-1 rounded-full uppercase font-bold text-muted-foreground">
                         {item.type}
                       </span>
                     </div>
                     <p className="text-xs text-muted-foreground mt-1 font-medium">Qty: {item.qty} • ₹{item.pricePerDay}/day</p>
                   </div>
                   <div className="text-right pl-2">
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
      </div>
    </div>
  );
}

export default function AdminBookingDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>}>
      <AdminBookingDetailsContent />
    </Suspense>
  )
}
