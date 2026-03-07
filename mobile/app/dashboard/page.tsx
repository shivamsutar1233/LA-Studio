"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Package, CalendarRange, Clock, Edit2, Check, X, User as UserIcon, Mail, Loader2, RefreshCw, CheckCircle, XCircle, Ban, KeyRound, ArrowRight, ChevronRight, Hash, ShieldCheck, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface Booking {
  id: string;
  gearIds: string; // JSON array string
  bundleIds?: string; // JSON array string
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  undertakingSigned: number;
  refundStatus?: string | null;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  } | null;
}

interface GearDetails {
  [key: string]: { name: string; thumbnail?: string };
}

export default function UserDashboard() {
  const router = useRouter();
  const { user, token, login, logout } = useAuthStore();
  const handleLogout = () => {
    logout();
    router.push('/auth/login');
    toast.success("Logged out successfully");
  };
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Profile Editing State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [gearInfo, setGearInfo] = useState<GearDetails>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Email Change OTP State
  type EmailChangeStep = 'idle' | 'enter-email' | 'verify-old' | 'verify-new' | 'done';
  const [emailChangeStep, setEmailChangeStep] = useState<EmailChangeStep>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [emailChangePendingDisplay, setEmailChangePendingDisplay] = useState('');
  const [isEmailChangePending, setIsEmailChangePending] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5; // Reduced for mobile

  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user) {
      router.push('/auth/login');
      return;
    } else if (user.role === 'admin') {
      router.push('/dashboard/admin');
      return;
    } else {
      setEditName(user.name);
    }

    const fetchDashboardData = async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      try {
        const bookingsRes = await api.get('/api/bookings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookings(bookingsRes.data);

        try {
          const [gearRes, bundleRes] = await Promise.all([
            api.get('/api/gears'),
            api.get('/api/bundles')
          ]);

          const gearMap: GearDetails = {};

          if (Array.isArray(gearRes.data)) {
            gearRes.data.forEach((g: any) => {
              gearMap[g.id] = { name: g.name, thumbnail: g.thumbnail };
            });
          }

          if (Array.isArray(bundleRes.data)) {
            bundleRes.data.forEach((b: any) => {
              gearMap[b.id] = { name: b.name, thumbnail: b.thumbnail };
            });
          }

          setGearInfo(gearMap);
        } catch (gearErr) {
          console.error("Failed to fetch gear data for map:", gearErr);
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Failed to load dashboard data.");
      } finally {
        if (isRefresh) {
          setTimeout(() => setIsRefreshing(false), 600);
        } else {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    (window as any).refreshUserDashboard = () => fetchDashboardData(true);

    return () => {
      delete (window as any).refreshUserDashboard;
    }
  }, [user, token, router, hasHydrated]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const res = await api.put('/api/users/me', {
        name: editName,
        email: user?.email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      login(res.data.user, res.data.token);
      setIsEditingProfile(false);
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRequestEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Invalid email');
      return;
    }
    setIsEmailChangePending(true);
    try {
      const res = await api.post('/api/users/request-email-change', { newEmail }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailChangePendingDisplay(newEmail);
      setEmailChangeStep('verify-old');
      setOtpValue('');
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsEmailChangePending(false);
    }
  };

  const handleVerifyOldOtp = async () => {
    if (otpValue.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setIsEmailChangePending(true);
    try {
      const res = await api.post('/api/users/verify-old-email-otp', { otp: otpValue }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailChangeStep('verify-new');
      setOtpValue('');
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsEmailChangePending(false);
    }
  };

  const handleVerifyNewOtp = async () => {
    if (otpValue.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setIsEmailChangePending(true);
    try {
      const res = await api.post('/api/users/verify-new-email-otp', { otp: otpValue }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      login(res.data.user, res.data.token);
      setEmailChangeStep('idle');
      setNewEmail('');
      setOtpValue('');
      toast.success('Email changed successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsEmailChangePending(false);
    }
  };

  const cancelEmailChange = () => {
    setEmailChangeStep('idle');
    setNewEmail('');
    setOtpValue('');
  };

  const handleResendOtp = async () => {
    setIsEmailChangePending(true);
    try {
      const res = await api.post('/api/users/request-email-change', { newEmail: emailChangePendingDisplay }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailChangeStep('verify-old');
      setOtpValue('');
      toast.success('OTP resent');
    } catch (err: any) {
      toast.error('Failed to resend OTP');
    } finally {
      setIsEmailChangePending(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await api.put(`/api/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Booking cancelled");
      (window as any).refreshUserDashboard?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Cancellation failed");
    }
  };

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return bookings.slice(start, start + ITEMS_PER_PAGE);
  }, [bookings, currentPage]);

  const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE) || 1;

  if (loading) {
    return <div className="flex-1 flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex-1 w-full py-4 pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Hello, {user?.name.split(' ')[0]}!</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-surface border border-surface-border p-4 rounded-2xl">
          <Package className="h-4 w-4 text-accent mb-2" />
          <p className="text-2xl font-black text-foreground">{bookings.length}</p>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total Runs</p>
        </div>
        <div className="bg-surface border border-surface-border p-4 rounded-2xl">
          <Clock className="h-4 w-4 text-accent mb-2" />
          <p className="text-2xl font-black text-foreground">{bookings.filter(b => b.status === 'confirmed').length}</p>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Active</p>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-surface border border-surface-border rounded-3xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-foreground">My Account</h2>
          {!isEditingProfile ? (
            <button onClick={() => setIsEditingProfile(true)} className="text-xs font-bold text-accent">Edit</button>
          ) : (
            <div className="flex gap-4">
              <button onClick={() => { setIsEditingProfile(false); setEditName(user?.name || ''); cancelEmailChange(); }} className="text-xs font-bold text-muted-foreground">Cancel</button>
              <button onClick={handleSaveProfile} disabled={isSavingProfile} className="text-xs font-bold text-accent">Save</button>
            </div>
          )}
        </div>

        {!isEditingProfile ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-background border border-surface-border flex items-center justify-center text-accent">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Name</p>
                <p className="text-sm font-bold text-foreground">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-background border border-surface-border flex items-center justify-center text-accent">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Email</p>
                <p className="text-sm font-bold text-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-accent outline-none"
              />
            </div>

            <div className="pt-4 border-t border-surface-border">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Email Security</p>
                {emailChangeStep === 'idle' && (
                  <button onClick={() => setEmailChangeStep('enter-email')} className="text-xs font-bold text-accent flex items-center gap-1">
                    <KeyRound className="h-3 w-3" /> Change
                  </button>
                )}
              </div>

              {emailChangeStep === 'enter-email' && (
                <div className="space-y-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="New email address"
                    className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent"
                  />
                  <button onClick={handleRequestEmailChange} disabled={isEmailChangePending} className="w-full bg-accent text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                    {isEmailChangePending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Request OTP'}
                  </button>
                </div>
              )}

              {(emailChangeStep === 'verify-old' || emailChangeStep === 'verify-new') && (
                <div className="space-y-3">
                  <p className="text-[10px] text-muted-foreground">OTP sent to {emailChangeStep === 'verify-old' ? user?.email : emailChangePendingDisplay}</p>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-center tracking-[1em] font-mono text-lg outline-none focus:ring-1 focus:ring-accent"
                  />
                  <button onClick={emailChangeStep === 'verify-old' ? handleVerifyOldOtp : handleVerifyNewOtp} disabled={isEmailChangePending} className="w-full bg-accent text-white py-2 rounded-xl text-xs font-bold">
                    {isEmailChangePending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Verify Code'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bookings Section */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Rentals</h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Your Gear History</p>
        </div>
        <button onClick={() => (window as any).refreshUserDashboard?.()} className="p-2 border border-surface-border rounded-xl text-muted-foreground">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-3xl p-12 text-center">
          <CalendarRange className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm font-bold text-muted-foreground mb-4">No rentals found</p>
          <Link href="/catalog" className="text-xs font-bold text-accent bg-accent/10 px-4 py-2 rounded-lg">Browse Catalog</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedBookings.map((booking) => {
            const gearNames = (() => {
              try {
                const ids = JSON.parse(booking.gearIds || '[]');
                return ids.map((item: any) => typeof item === 'string' ? (gearInfo[item]?.name || 'Item') : item.name).join(', ');
              } catch { return 'Gear Item'; }
            })();

            return (
              <div 
                key={booking.id} 
                className="bg-surface border border-surface-border hover:border-accent/50 rounded-3xl p-5 transition-all cursor-pointer"
                onClick={() => router.push(`/dashboard/booking?id=${booking.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">{booking.id.slice(-8)}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                      'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                    {booking.status}
                  </div>
                </div>

                <h3 className="text-lg font-black text-foreground mb-1 leading-tight">{gearNames}</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-4">{booking.startDate} to {booking.endDate}</p>

                <div className="flex justify-between items-center pt-4 border-t border-surface-border/50">
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    {booking.status === 'confirmed' && booking.undertakingSigned !== 1 && (
                      <button onClick={() => router.push(`/dashboard/user/undertaking?id=${booking.id}`)} className="text-[10px] font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-lg hover:bg-accent hover:text-white transition-colors">Sign Doc</button>
                    )}
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button onClick={() => handleCancelBooking(booking.id)} className="text-[10px] font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-colors">Cancel</button>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                </div>
              </div>
            )
          })}

          <div className="pt-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}

      {/* Help & Legal Section */}
      <div className="mt-12 space-y-6">
        <h2 className="text-xl font-black text-foreground px-1">Help & Legal</h2>
        <div className="bg-surface border border-surface-border rounded-3xl overflow-hidden">
          <Link href="/how-it-works" className="flex items-center justify-between p-5 hover:bg-accent/5 active:bg-accent/5 transition-colors border-b border-surface-border/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                <Package className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-foreground">How it Works</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Link href="/faq" className="flex items-center justify-between p-5 hover:bg-accent/5 active:bg-accent/5 transition-colors border-b border-surface-border/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
                <Hash className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-foreground">FAQs</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Link href="/contact" className="flex items-center justify-between p-5 hover:bg-accent/5 active:bg-accent/5 transition-colors border-b border-surface-border/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                <Mail className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-foreground">Contact Support</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Link href="/terms" className="flex items-center justify-between p-5 hover:bg-accent/5 active:bg-accent/5 transition-colors border-b border-surface-border/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-foreground">Terms of Service</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Link href="/privacy-policy" className="flex items-center justify-between p-5 hover:bg-accent/5 active:bg-accent/5 transition-colors border-b border-surface-border/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500">
                <KeyRound className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-foreground">Privacy Policy</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Link href="/shipping-delivery" className="flex items-center justify-between p-5 hover:bg-accent/5 active:bg-accent/5 transition-colors border-b border-surface-border/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-yellow-500/10 rounded-lg flex items-center justify-center text-yellow-500">
                <Package className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-foreground">Shipping Policy</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Link href="/cancellation-refund" className="flex items-center justify-between p-5 hover:bg-accent/5 active:bg-accent/5 transition-colors border-b border-surface-border/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500">
                <RefreshCw className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-foreground">Refund Policy</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-5 hover:bg-red-500/5 active:bg-red-500/5 transition-colors text-red-500"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                <LogOut className="h-4 w-4" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest">Logout Session</span>
            </div>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
