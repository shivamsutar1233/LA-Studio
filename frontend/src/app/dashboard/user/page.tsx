"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Package, CalendarRange, Clock, Edit2, Check, X, User as UserIcon, Mail, Loader2, RefreshCw, CheckCircle, XCircle, Ban, KeyRound, ArrowRight } from 'lucide-react';
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
}

interface GearDetails {
  [key: string]: { name: string; thumbnail?: string };
}

export default function UserDashboard() {
  const router = useRouter();
  const { user, token, login } = useAuthStore();
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
  const ITEMS_PER_PAGE = 10;

  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return; // Wait for Zustand to load from localStorage

    if (!user) {
      router.push('/auth/login');
      return;
    } else {
      setEditName(user.name);
    }

    const fetchDashboardData = async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      try {
        // Fetch User Bookings
        const bookingsRes = await api.get('/api/bookings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookings(bookingsRes.data);

        // Fetch Gear Details to map IDs to Names
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

    // Attach to window so we can trigger it from outside the effect if needed
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
        email: user?.email // email is now changed via OTP flow only
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      login(res.data.user, res.data.token);
      setIsEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error("Profile update error", error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ─── Email Change OTP Handlers ───────────────────────────────────────────────
  const handleRequestEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
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
      toast.error(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setIsEmailChangePending(false);
    }
  };

  const handleVerifyOldOtp = async () => {
    if (otpValue.length !== 6) { toast.error('Please enter the 6-digit OTP.'); return; }
    setIsEmailChangePending(true);
    try {
      const res = await api.post('/api/users/verify-old-email-otp', { otp: otpValue }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailChangeStep('verify-new');
      setOtpValue('');
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setIsEmailChangePending(false);
    }
  };

  const handleVerifyNewOtp = async () => {
    if (otpValue.length !== 6) { toast.error('Please enter the 6-digit OTP.'); return; }
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
      toast.error(err.response?.data?.message || 'Invalid OTP.');
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
      toast.success('OTP resent! ' + res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setIsEmailChangePending(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) return;
    try {
      await api.put(`/api/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Booking cancelled");
      (window as any).refreshUserDashboard?.();
    } catch (error: any) {
      console.error("Cancel error", error);
      toast.error(error.response?.data?.message || "Failed to cancel booking");
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
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-foreground mb-2">My Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}. Here is a summary of your account and rentals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Profile Card */}
        <div className="bg-surface/50 backdrop-blur-xl border border-surface-border/50 rounded-2xl p-6 flex flex-col relative shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-bold text-foreground">My Profile</h2>
            {!isEditingProfile ? (
              <button onClick={() => setIsEditingProfile(true)} className="p-2 bg-surface border border-surface-border rounded-lg text-muted-foreground hover:text-accent hover:border-accent/50 transition-colors">
                <Edit2 className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setIsEditingProfile(false); setEditName(user?.name || ''); cancelEmailChange(); }} className="p-2 bg-surface border border-surface-border rounded-lg text-muted-foreground hover:text-red-500 transition-colors">
                  <X className="h-4 w-4" />
                </button>
                <button onClick={handleSaveProfile} disabled={isSavingProfile} className="p-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50">
                  <Check className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {!isEditingProfile ? (
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Name</p>
                  <p className="text-foreground font-medium truncate">{user?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-surface-border/50 border border-surface-border flex items-center justify-center text-muted-foreground shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Email</p>
                  <p className="text-foreground font-medium truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Email Change Section */}
              <div className="border border-surface-border rounded-xl p-3 bg-background/50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</p>
                    <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                  </div>
                  {emailChangeStep === 'idle' && (
                    <button
                      onClick={() => setEmailChangeStep('enter-email')}
                      className="text-xs font-bold text-accent hover:underline flex items-center gap-1 shrink-0 ml-2"
                    >
                      <KeyRound className="h-3 w-3" /> Change
                    </button>
                  )}
                </div>

                {/* Step: Enter new email */}
                {emailChangeStep === 'enter-email' && (
                  <div className="space-y-2 pt-1 border-t border-surface-border">
                    <p className="text-xs text-muted-foreground mt-2">Enter your new email address:</p>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="new@email.com"
                      className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                    <div className="flex gap-2">
                      <button onClick={cancelEmailChange} className="flex-1 text-xs py-2 border border-surface-border rounded-lg text-muted-foreground hover:border-red-500/30 hover:text-red-500 transition-colors">Cancel</button>
                      <button onClick={handleRequestEmailChange} disabled={isEmailChangePending} className="flex-1 text-xs py-2 bg-accent text-white rounded-lg font-bold hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                        {isEmailChangePending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><ArrowRight className="h-3 w-3" /> Send OTP</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step: Verify OTP from old email */}
                {emailChangeStep === 'verify-old' && (
                  <div className="space-y-2 pt-1 border-t border-surface-border">
                    <p className="text-xs text-muted-foreground mt-2">Enter the OTP sent to <span className="font-semibold text-foreground">{user?.email}</span>:</p>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground text-center tracking-[0.5em] font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                    <div className="flex gap-2">
                      <button onClick={cancelEmailChange} className="flex-1 text-xs py-2 border border-surface-border rounded-lg text-muted-foreground hover:border-red-500/30 hover:text-red-500 transition-colors">Cancel</button>
                      <button onClick={handleVerifyOldOtp} disabled={isEmailChangePending} className="flex-1 text-xs py-2 bg-accent text-white rounded-lg font-bold hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                        {isEmailChangePending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3" /> Verify</>}
                      </button>
                    </div>
                    <button onClick={handleResendOtp} disabled={isEmailChangePending} className="w-full text-center text-xs text-muted-foreground hover:text-accent transition-colors disabled:opacity-50 mt-1">
                      Didn't receive it? <span className="font-semibold underline">Resend OTP</span>
                    </button>
                  </div>
                )}

                {/* Step: Verify OTP from new email */}
                {emailChangeStep === 'verify-new' && (
                  <div className="space-y-2 pt-1 border-t border-surface-border">
                    <p className="text-xs text-muted-foreground mt-2">Enter the OTP sent to <span className="font-semibold text-foreground">{emailChangePendingDisplay}</span>:</p>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground text-center tracking-[0.5em] font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                    <div className="flex gap-2">
                      <button onClick={cancelEmailChange} className="flex-1 text-xs py-2 border border-surface-border rounded-lg text-muted-foreground hover:border-red-500/30 hover:text-red-500 transition-colors">Cancel</button>
                      <button onClick={handleVerifyNewOtp} disabled={isEmailChangePending} className="flex-1 text-xs py-2 bg-accent text-white rounded-lg font-bold hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                        {isEmailChangePending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle className="h-3 w-3" /> Confirm Change</>}
                      </button>
                    </div>
                    <button onClick={handleResendOtp} disabled={isEmailChangePending} className="w-full text-center text-xs text-muted-foreground hover:text-accent transition-colors disabled:opacity-50 mt-1">
                      Didn't receive it? <span className="font-semibold underline">Resend OTP</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Container */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-surface border border-surface-border rounded-2xl p-6 flex flex-col justify-center">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <Package className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-sm">Total Rentals</h3>
            </div>
            <p className="text-3xl font-black text-foreground">{bookings.length}</p>
          </div>
          <div className="bg-surface border border-surface-border rounded-2xl p-6 flex flex-col justify-center">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <Clock className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-sm">Active Bookings</h3>
            </div>
            <p className="text-3xl font-black text-foreground">{bookings.filter(b => b.status === 'confirmed').length}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Rental History</h2>
        <button
          onClick={() => (window as any).refreshUserDashboard?.()}
          disabled={isRefreshing}
          className="p-2 mr-2 rounded-full hover:bg-surface border border-transparent hover:border-surface-border text-muted-foreground hover:text-foreground transition-all disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
          title="Refresh Bookings"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <CalendarRange className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">No rentals yet</h3>
          <p className="text-muted-foreground mb-6">You haven't booked any gear. Head over to the catalog to get started!</p>
          <button
            onClick={() => router.push('/catalog')}
            className="px-6 py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent-hover transition-colors"
          >
            Browse Catalog
          </button>
        </div>
      ) : (
        <>
          <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] min-h-[600px]">
              <table className="w-full text-left border-collapse sticky-header">
                <thead className="sticky top-0 z-10 bg-surface">
                  <tr className="border-b border-surface-border bg-background/50">
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Booking ID</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dates</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {paginatedBookings.map((booking) => {
                    const gearListStr = (() => {
                      try {
                        let allIds: any[] = [];

                        if (booking.gearIds) {
                          try {
                            const gIds = JSON.parse(booking.gearIds);
                            if (Array.isArray(gIds)) allIds = [...allIds, ...gIds];
                          } catch (e) { allIds.push(booking.gearIds); }
                        }

                        if (booking.bundleIds) {
                          try {
                            const bIds = JSON.parse(booking.bundleIds);
                            if (Array.isArray(bIds)) allIds = [...allIds, ...bIds];
                          } catch (e) { }
                        }

                        if (allIds.length === 0) return 'No Items';

                        return allIds.map((item: any) => {
                          if (typeof item === 'string') {
                            return gearInfo[item]?.name || 'Unknown Item';
                          } else if (item && item.id) {
                            const qtyStr = item.quantity && item.quantity > 1 ? ` x${item.quantity}` : '';
                            return `${item.name}${qtyStr} (${item.days} days)`;
                          }
                          return 'Unknown Item';
                        }).join(', ');
                      } catch (e) {
                        return 'Error parsing items';
                      }
                    })();

                    return (
                      <tr key={booking.id} className="hover:bg-background/30 transition-colors">
                        <td className="p-4 text-sm font-mono text-muted-foreground">#{booking.id}</td>
                        <td className="p-4 text-sm font-bold text-foreground max-w-[200px]" title={gearListStr}>
                          <div className="truncate">
                            {gearListStr}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-foreground">
                          {booking.startDate} &rarr; {booking.endDate}
                        </td>
                        <td className="p-4 text-sm">
                          <div className="flex flex-col gap-2 items-start">
                            {booking.status === 'cancelled' ? (
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${booking.refundStatus === 'processed'
                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                }`}>
                                {booking.refundStatus === 'processed' ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                                <span>Refund {booking.refundStatus === 'processed' ? 'Processed' : 'Pending'}</span>
                              </div>
                            ) : (
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                booking.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                  'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                }`}>
                                {booking.status === 'confirmed' && <CheckCircle className="h-3.5 w-3.5" />}
                                {booking.status === 'rejected' && <XCircle className="h-3.5 w-3.5" />}
                                {booking.status === 'pending' && <Clock className="h-3.5 w-3.5" />}
                                <span>{booking.status}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 flex items-center justify-end gap-2">
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <>
                              {booking.status === 'confirmed' && (
                                booking.undertakingSigned === 1 ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                                    <Check className="h-3 w-3" /> Signed
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => router.push(`/dashboard/user/undertaking/${booking.id}`)}
                                    className="text-[10px] font-bold bg-accent text-white px-3 py-1.5 rounded hover:bg-accent-hover transition-colors shadow-sm"
                                  >
                                    Sign Undertaking
                                  </button>
                                )
                              )}
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="text-[10px] font-bold text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded border border-red-500/20 transition-colors"
                              >
                                Cancel Booking
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  );
}
