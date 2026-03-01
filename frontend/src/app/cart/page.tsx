"use client";

import Link from 'next/link';
import { Trash2, ShieldCheck, ChevronRight, Lock, Plus, Minus, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { differenceInDays, parseISO, format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface ValidationResult {
  valid: boolean;
  unavailableItems?: any[];
}

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault: number;
}

export default function CartPage() {
  const { items: cartItems, removeFromCart, clearCart, updateCartItemDates, updateCartItemQuantity } = useCartStore();
  const { user, token } = useAuthStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isValidatingCart, setIsValidatingCart] = useState(false);
  const [cartValidationResult, setCartValidationResult] = useState<ValidationResult | null>(null);
  const [mounted, setMounted] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ street: '', city: '', state: '', zip: '', isDefault: true });

  useEffect(() => {
    setMounted(true);
    if (token) {
      fetchAddresses();
    }
  }, [token]);

  const [bookedDatesMap, setBookedDatesMap] = useState<Record<string, { start: Date, end: Date }[]>>({});

  useEffect(() => {
    const fetchBookings = async () => {
      const uniqueGearIds = Array.from(new Set(cartItems.map(item => item.gearId)));
      const maps: Record<string, { start: Date, end: Date }[]> = {};

      await Promise.all(uniqueGearIds.map(async (gid) => {
        try {
          // Only fetch if we haven't already
          if (!bookedDatesMap[gid]) {
            const res = await api.get(`/api/gears/${gid}/booked-dates`);
            maps[gid] = res.data.map((b: any) => ({
              start: new Date(b.startDate),
              end: new Date(b.endDate)
            }));
          }
        } catch {
          maps[gid] = [];
        }
      }));

      if (Object.keys(maps).length > 0) {
        setBookedDatesMap(prev => ({ ...prev, ...maps }));
      }
    };

    if (cartItems.length > 0) {
      fetchBookings();
    }
  }, [cartItems]);

  useEffect(() => {
    // Validate cart whenever it changes
    const validateCart = async () => {
      if (cartItems.length === 0) {
        setCartValidationResult({ valid: true });
        return;
      }

      setIsValidatingCart(true);
      try {
        const res = await api.post('/api/validate-cart', { cartItems });
        setCartValidationResult(res.data);
      } catch (err: any) {
        if (err.response && err.response.data) {
          setCartValidationResult(err.response.data);
        }
      } finally {
        setIsValidatingCart(false);
      }
    };

    validateCart();
  }, [cartItems]);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/api/users/me/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddresses(res.data);
      if (res.data.length > 0) {
        const defaultAddr = res.data.find((a: Address) => a.isDefault === 1);
        setSelectedAddressId(defaultAddr ? defaultAddr.id : res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch addresses");
    }
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/users/me/addresses', newAddress, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Address saved securely');
      setIsAddingAddress(false);
      setNewAddress({ street: '', city: '', state: '', zip: '', isDefault: true });
      await fetchAddresses();
      setSelectedAddressId(res.data.address.id);
    } catch (error) {
      toast.error('Failed to save address');
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.pricePerDay * item.days * item.quantity), 0);
  const deposit = cartItems.length > 0 ? 150 : 0; // Refundable deposit only if items exist
  const total = subtotal + deposit;

  const handleDateChange = (id: string, field: 'startDate' | 'endDate', value: string, currentItem: any) => {
    let newStart = field === 'startDate' ? value : currentItem.startDate;
    let newEnd = field === 'endDate' ? value : currentItem.endDate;
    let days = 0;
    if (newStart && newEnd) {
      const start = parseISO(newStart);
      const end = parseISO(newEnd);
      const diff = differenceInDays(end, start);
      days = diff > 0 ? diff : 0;
    }
    updateCartItemDates(id, newStart, newEnd, days);
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error('You must be logged in to place an order.');
      return;
    }

    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }

    setIsCheckingOut(true);
    try {
      // 1. Validate Cart Availability First
      try {
        await api.post('/api/validate-cart', { cartItems });
      } catch (validationError: any) {
        if (validationError.response && validationError.response.status === 400) {
          toast.error('Availability Error', {
            description: validationError.response.data.message || 'Some items are no longer available for the selected dates.'
          });
          return;
        }
        throw validationError;
      }

      // 2. Create Order on Backend
      const orderRes = await api.post('/api/payment/create-order', {
        amount: total * 100, // Razorpay expects amount in paise
        currency: "INR"
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const orderData = orderRes.data;

      // 3. Initialize Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '', // Needs to be added to frontend env
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Lean Angle Studio",
        description: "Gear Rental Booking",
        image: "https://ab2bbkrtuubturud.public.blob.vercel-storage.com/product_images/1771907071468-n7j05b1-Lean%20Angle%20Logo%20V2%20.png",
        order_id: orderData.id,
        handler: async function (response: any) {
          // 4. Verify Payment
          try {
            await api.post('/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            // 5. Log the Booking
            const minDate = cartItems.reduce((min, p) => p.startDate < min ? p.startDate : min, cartItems[0].startDate);
            const maxDate = cartItems.reduce((max, p) => p.endDate > max ? p.endDate : max, cartItems[0].endDate);

            await api.post('/api/rentals', {
              cartItems: cartItems.map(item => ({
                id: item.gearId,
                name: item.name,
                startDate: item.startDate,
                endDate: item.endDate,
                days: item.days,
                pricePerDay: item.pricePerDay,
                quantity: item.quantity
              })),
              startDate: minDate,
              endDate: maxDate,
              customerDetails: { name: user?.name || 'Guest Checkout' },
              addressId: selectedAddressId
            }, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            toast.success('Payment successful!', { description: 'Your rental has been securely booked.' });
            clearCart();
          } catch (verificationError) {
            console.error('Payment Verification Failed', verificationError);
            toast.error('Verification failed', { description: 'Please contact support.' });
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: "#DB8218"
        }
      };

      // @ts-ignore
      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        toast.error('Payment Failed', { description: response.error.description });
      });
      rzp1.open();

    } catch (error) {
      console.error('Checkout failed', error);
      toast.error('Checkout failed', { description: 'Please ensure the backend server is running.' });
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-8 tracking-tight">Your Rental Cart</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items */}
        <div className="flex-1">
          {cartItems.length === 0 ? (
            <div className="text-center py-24 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-xl shadow-black/20">
              <p className="text-muted-foreground mb-6 text-lg">Your cart is empty.</p>
              <Link href="/catalog" className="inline-flex items-center gap-2 bg-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-accent-hover transition-colors">
                Browse Gear
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl bg-white/5 backdrop-blur-3xl border border-white/10 shadow-lg shadow-black/10 transition-all hover:border-accent/30 hover:bg-white/10">
                  <div className="w-full sm:w-32 aspect-video sm:aspect-square bg-background rounded-xl border border-surface-border/50 flex items-center justify-center shrink-0">
                    <span className="text-[10px] text-muted-foreground font-mono">IMG_100x100</span>
                  </div>

                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-bold text-accent tracking-wider uppercase mb-1">{item.category}</p>
                        <h3 className="text-xl font-bold text-foreground leading-tight">{item.name}</h3>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-accent transition-colors">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-auto flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 border-t border-surface-border pt-4">

                      <style jsx global>{`
                        .custom-datepicker {
                          background-color: var(--surface) !important;
                          border-color: var(--surface-border) !important;
                          border-radius: 1rem !important;
                          font-family: inherit !important;
                          color: var(--foreground) !important;
                          padding: 1rem !important;
                          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
                        }
                        .react-datepicker__header {
                          background-color: transparent !important;
                          border-bottom: 1px solid var(--surface-border) !important;
                          padding-top: 0.5rem !important;
                        }
                        .react-datepicker__current-month, .react-datepicker__day-name {
                          color: var(--foreground) !important;
                          font-weight: bold !important;
                        }
                        .react-datepicker__day {
                          color: var(--foreground) !important;
                          border-radius: 0.5rem !important;
                          margin: 0.2rem !important;
                          transition: all 0.2s !important;
                        }
                        .react-datepicker__day:hover:not(.react-datepicker__day--disabled) {
                          background-color: var(--surface-border) !important;
                        }
                        .react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range {
                          background-color: var(--accent) !important;
                          color: white !important;
                        }
                        .react-datepicker__day--disabled {
                          color: var(--muted-foreground) !important;
                          opacity: 0.3 !important;
                          text-decoration: line-through !important;
                        }
                        .react-datepicker-popper[data-placement^="bottom"] .react-datepicker__triangle {
                          fill: var(--surface) !important;
                          color: var(--surface) !important;
                          stroke: var(--surface-border) !important;
                        }
                      `}</style>

                      <div className="flex flex-col gap-2 w-full xl:w-auto">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="relative w-36">
                            <DatePicker
                              selected={item.startDate ? parseISO(item.startDate) : null}
                              onChange={(date: Date | null) => handleDateChange(item.id, 'startDate', date ? format(date, 'yyyy-MM-dd') : '', item)}
                              selectsStart
                              startDate={item.startDate ? parseISO(item.startDate) : undefined}
                              endDate={item.endDate ? parseISO(item.endDate) : undefined}
                              minDate={new Date()}
                              excludeDateIntervals={bookedDatesMap[item.gearId] || []}
                              placeholderText="Start Date"
                              className="w-full px-3 py-1.5 text-sm font-medium rounded-lg bg-surface border border-surface-border text-foreground hover:border-accent/50 focus:ring-accent focus:border-accent transition-colors cursor-pointer text-center"
                              calendarClassName="custom-datepicker"
                              wrapperClassName="w-full"
                              dateFormat="MMM dd, yyyy"
                            />
                          </div>

                          <span className="text-muted-foreground text-sm flex-shrink-0">&rarr;</span>

                          <div className="relative w-36">
                            <DatePicker
                              selected={item.endDate ? parseISO(item.endDate) : null}
                              onChange={(date: Date | null) => handleDateChange(item.id, 'endDate', date ? format(date, 'yyyy-MM-dd') : '', item)}
                              selectsEnd
                              startDate={item.startDate ? parseISO(item.startDate) : undefined}
                              endDate={item.endDate ? parseISO(item.endDate) : undefined}
                              minDate={item.startDate ? parseISO(item.startDate) : new Date()}
                              excludeDateIntervals={bookedDatesMap[item.gearId] || []}
                              placeholderText="End Date"
                              className="w-full px-3 py-1.5 text-sm font-medium rounded-lg bg-surface border border-surface-border text-foreground hover:border-accent/50 focus:ring-accent focus:border-accent transition-colors cursor-pointer text-center"
                              calendarClassName="custom-datepicker"
                              wrapperClassName="w-full"
                              dateFormat="MMM dd, yyyy"
                            />
                          </div>
                          <span className="text-sm font-bold ml-1 text-accent flex-shrink-0 bg-accent/10 px-2 py-0.5 rounded-md">{item.days} days</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Rate: ₹{item.pricePerDay}/day</span>
                      </div>

                      <div className="flex items-center gap-1 xl:ml-auto bg-background border border-surface-border rounded-lg p-1">
                        <button onClick={() => updateCartItemQuantity(item.id, Math.max(1, item.quantity - 1))} className="p-1.5 hover:bg-surface rounded text-muted-foreground hover:text-foreground transition-colors"><Minus className="h-4 w-4" /></button>
                        <span className="w-6 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                        <button onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)} className="p-1.5 hover:bg-surface rounded text-muted-foreground hover:text-foreground transition-colors"><Plus className="h-4 w-4" /></button>
                      </div>

                      <span className="text-2xl font-black text-foreground">₹{item.pricePerDay * item.days * item.quantity}</span>
                    </div>
                    {cartValidationResult?.unavailableItems?.some((unav: any) => unav.id === item.id || unav.id === item.gearId) && (
                      <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-2 rounded-lg text-sm font-medium">
                        Not available for selected dates. Please change dates.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        {cartItems.length > 0 && (
          <div className="w-full lg:w-96 shrink-0 space-y-6">

            {/* Delivery Address Card */}
            {user && (
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Delivery Address</h2>
                  {addresses.length > 0 && !isAddingAddress && (
                    <button onClick={() => setIsAddingAddress(true)} className="text-sm text-accent hover:text-accent-hover font-bold transition-colors">
                      + Add New
                    </button>
                  )}
                </div>

                {isAddingAddress || addresses.length === 0 ? (
                  <form onSubmit={handleSaveNewAddress} className="space-y-3">
                    <input type="text" required placeholder="Street Address" value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" required placeholder="City" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent" />
                      <input type="text" required placeholder="State" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent" />
                    </div>
                    <input type="text" required placeholder="ZIP Code" value={newAddress.zip} onChange={e => setNewAddress({ ...newAddress, zip: e.target.value })} className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent" />
                    <div className="flex gap-2 pt-2">
                      {addresses.length > 0 && (
                        <button type="button" onClick={() => setIsAddingAddress(false)} className="flex-1 bg-surface py-2 rounded-lg font-bold text-sm hover:bg-surface-border transition-colors">Cancel</button>
                      )}
                      <button type="submit" className="flex-1 bg-accent text-white py-2 rounded-lg font-bold text-sm hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20">Save Address</button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {addresses.map(addr => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-accent bg-accent/5' : 'border-surface-border bg-background hover:border-accent/40'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${selectedAddressId === addr.id ? 'border-accent bg-accent' : 'border-muted-foreground'}`}>
                            {selectedAddressId === addr.id && <div className="h-1.5 w-1.5 bg-white rounded-full"></div>}
                          </div>
                          <div className="text-sm">
                            <p className="font-bold text-foreground">{addr.street}</p>
                            <p className="text-muted-foreground">{addr.city}, {addr.state} {addr.zip}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Price Summary Card */}
            <div className="sticky top-24 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/20">
              <h2 className="text-xl font-bold text-foreground mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Rental Subtotal</span>
                  <span className="text-foreground font-medium">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Refundable Deposit</span>
                  <span className="text-foreground font-medium">₹{deposit}</span>
                </div>
                <div className="border-t border-surface-border pt-4 flex justify-between items-center">
                  <span className="text-lg font-bold text-foreground">Total Due Today</span>
                  <span className="text-3xl font-black text-foreground">₹{total}</span>
                </div>
              </div>

              {user ? (
                <button
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0 || isCheckingOut || isValidatingCart || cartValidationResult?.valid === false}
                  className="w-full flex items-center justify-center gap-2 bg-accent text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-accent-hover transition-all active:scale-[0.98] shadow-lg shadow-accent/20 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidatingCart ? 'Validating...' : isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : (
                <Link
                  href="/auth/login?redirect=/cart"
                  className="w-full flex items-center justify-center gap-2 bg-surface border border-surface-border text-foreground px-6 py-4 rounded-xl font-bold text-lg hover:bg-surface-border transition-all active:scale-[0.98] mb-4"
                >
                  Log in to Checkout
                </Link>
              )}

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-6">
                <Lock className="h-4 w-4" /> Secure, 256-bit encrypted checkout
              </div>
            </div>

            <div className="mt-6 flex gap-3 p-4 rounded-xl bg-accent/5 border border-accent/20">
              <ShieldCheck className="h-8 w-8 text-accent shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground block mb-1">100% Guaranteed</span>
                Gear is tested and sanitized before every rental. Cancellations accepted up to 48 hours before start date.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
