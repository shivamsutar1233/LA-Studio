"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Package, CalendarRange, Clock, Edit2, Check, X, User as UserIcon, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface Booking {
  id: string;
  gearIds: string; // JSON array string
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
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
  const [editEmail, setEditEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [gearInfo, setGearInfo] = useState<GearDetails>({});
  const [loading, setLoading] = useState(true);

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
      setEditEmail(user.email);
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch User Bookings
        const bookingsRes = await api.get('/api/bookings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookings(bookingsRes.data);

        // Fetch Gear Details to map IDs to Names (In a real app, populate this on backend)
        try {
          const gearRes = await api.get('/api/gears');
          const gearMap: GearDetails = {};
          if (Array.isArray(gearRes.data)) {
            gearRes.data.forEach((g: any) => {
              gearMap[g.id] = { name: g.name, thumbnail: g.thumbnail };
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
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, token, router, hasHydrated]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const res = await api.put('/api/users/me', {
        name: editName,
        email: editEmail
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

  if (loading) {
    return <div className="flex-1 flex items-center justify-center p-20"><p className="text-muted-foreground">Loading dashboard...</p></div>;
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
                <button onClick={() => { setIsEditingProfile(false); setEditName(user?.name || ''); setEditEmail(user?.email || ''); }} className="p-2 bg-surface border border-surface-border rounded-lg text-muted-foreground hover:text-red-500 transition-colors">
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
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Name</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Email</label>
                <input 
                  type="email" 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
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

      <h2 className="text-2xl font-bold text-foreground mb-6">Rental History</h2>
      
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
        <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-background/50">
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Booking ID</th>
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item</th>
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dates</th>
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-background/30 transition-colors">
                    <td className="p-4 text-sm font-mono text-muted-foreground">#{booking.id}</td>
                    <td className="p-4 text-sm font-bold text-foreground">
                      {booking.gearIds ? (() => {
                        try {
                          const ids = JSON.parse(booking.gearIds);
                          if (Array.isArray(ids)) {
                            return ids.map((item: any) => {
                                if (typeof item === 'string') {
                                    return gearInfo[item]?.name || 'Unknown Gear';
                                } else if (item && item.id) {
                                    const qtyStr = item.quantity && item.quantity > 1 ? ` x${item.quantity}` : '';
                                    return `${item.name}${qtyStr} (${item.days} days)`;
                                }
                                return 'Unknown Item';
                            }).join(', ');
                          }
                          return 'Invalid format';
                        } catch(e) {
                          // Fallback if migration hasn't converted old single UUIDs yet
                          return gearInfo[booking.gearIds]?.name || 'Legacy Gear Entry';
                        }
                      })() : 'No Gear'}
                    </td>
                    <td className="p-4 text-sm text-foreground">
                      {booking.startDate} &rarr; {booking.endDate}
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        booking.status === 'confirmed' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                        booking.status === 'rejected' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                        'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
