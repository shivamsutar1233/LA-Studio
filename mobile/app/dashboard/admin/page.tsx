"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Users, FileText, Activity, Plus, Loader2, RefreshCw, Hash, ChevronRight, Package, CheckCircle, XCircle, Trash2, Edit2, RotateCcw, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import Pagination from '@/components/ui/Pagination';
import { AdminModals } from '@/components/admin/AdminModals';

interface AdminBooking {
  id: string;
  userId: string;
  gearIds: string; // JSON array string
  bundleIds?: string; // JSON array string of bundle IDs
  startDate: string;
  endDate: string;
  status: string;
  customerDetails?: any;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  } | null;
  undertakingSigned: number;
  aadhaarNumber?: string | null;
  aadhaarUrl?: string | null;
  refundStatus?: string | null;
  createdAt: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface GearData {
  id: string;
  name: string;
  category: string;
  pricePerDay: number;
  thumbnail: string;
  images: string;
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <AdminDashboard />
    </Suspense>
  );
}

function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, logout } = useAuthStore();

  const initialTab = (searchParams.get('tab') as 'bookings' | 'inventory' | 'bundles' | 'users' | 'refunds') || 'bookings';
  const [activeTab, setActiveTab] = useState<'bookings' | 'inventory' | 'bundles' | 'users' | 'refunds'>(initialTab);

  const handleTabChange = (tab: 'bookings' | 'inventory' | 'bundles' | 'users' | 'refunds') => {
    setActiveTab(tab);
    setBookingsPage(1); setInventoryPage(1); setBundlesPage(1); setUsersPage(1); setRefundsPage(1);
    router.push(`/dashboard/admin?tab=${tab}`);
  };

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [gears, setGears] = useState<GearData[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [bookingsPage, setBookingsPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [bundlesPage, setBundlesPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [refundsPage, setRefundsPage] = useState(1);
  const ITEMS_PER_PAGE = 8; // Adapted for mobile view

  // Expanded card tracking
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGear, setEditingGear] = useState<GearData | null>(null);

  const [formData, setFormData] = useState({ name: '', category: 'Camera', pricePerDay: 0, thumbnail: '', images: '[]' });
  const [isUploading, setIsUploading] = useState(false);

  // Bundle Modal State
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<any | null>(null);
  const [bundleFormData, setBundleFormData] = useState({ name: '', description: '', pricePerDay: 0, thumbnail: '', images: '[]', gearIds: '[]' });

  const loadAdminData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const [bookingsRes, gearsRes, bundlesRes] = await Promise.all([
        api.get('/api/admin/bookings', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/gears'),
        api.get('/api/bundles')
      ]);
      setBookings(bookingsRes.data.bookings || []);
      setUsers(bookingsRes.data.users || []);
      setGears(gearsRes.data || []);
      setBundles(bundlesRes.data || []);
    } catch (error) {
      console.error("Failed to fetch admin data", error);
      toast.error("Failed to load admin data");
    } finally {
      if (isManualRefresh) {
        setTimeout(() => setIsRefreshing(false), 600);
      } else {
        setLoading(false);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'thumbnail' | 'images') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      if (field === 'thumbnail') {
        const formDataPayload = new FormData();
        formDataPayload.append('file', files[0]);
        const res = await api.post('/api/admin/upload', formDataPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFormData(prev => ({ ...prev, thumbnail: res.data.url }));
        setBundleFormData(prev => ({ ...prev, thumbnail: res.data.url }));
        toast.success("Thumbnail uploaded");
      } else {
        const uploadedUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const formDataPayload = new FormData();
          formDataPayload.append('file', files[i]);
          const res = await api.post('/api/admin/upload', formDataPayload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          uploadedUrls.push(res.data.url);
        }

        setFormData(prev => {
          const currentImages = JSON.parse(prev.images || '[]');
          const updatedImages = [...currentImages, ...uploadedUrls];
          return { ...prev, images: JSON.stringify(updatedImages) };
        });
        toast.success(`Uploaded ${uploadedUrls.length} image(s)`);
      }
    } catch (error) {
      console.error("Upload error", error);
      toast.error("Upload failed.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleGearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGear) {
        await api.put(`/api/gears/${editingGear.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Gear updated successfully");
      } else {
        await api.post('/api/gears', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("New gear added successfully");
      }
      setIsModalOpen(false);
      loadAdminData();
    } catch (error) {
      console.error("Error saving gear", error);
      toast.error("Failed to save gear");
    }
  };

  const handleBundleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBundle) {
        await api.put(`/api/bundles/${editingBundle.id}`, bundleFormData, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Bundle updated successfully");
      } else {
        await api.post('/api/bundles', bundleFormData, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("New bundle created successfully");
      }
      setIsBundleModalOpen(false);
      loadAdminData();
    } catch (error) {
      console.error("Error saving bundle", error);
      toast.error("Failed to save bundle");
    }
  };

  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    loadAdminData();
  }, [user, token, router, hasHydrated]);

  const stats = useMemo(() => {
    return {
      totalRevenue: bookings.length * 150,
      activeRentals: bookings.filter(b => b.status === 'confirmed').length,
      totalUsers: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      totalGear: gears.length
    };
  }, [bookings, users, gears]);

  const processedBookings = useMemo(() => {
    return bookings.map(b => ({
      ...b,
      customerName: users.find(u => u.id === b.userId)?.name || b.customerDetails?.name || 'Guest'
    }));
  }, [bookings, users]);

  // Pagination for all tabs
  const paginatedBookings = useMemo(() => processedBookings.slice((bookingsPage - 1) * ITEMS_PER_PAGE, bookingsPage * ITEMS_PER_PAGE), [processedBookings, bookingsPage]);
  const totalBookingsPages = Math.ceil(processedBookings.length / ITEMS_PER_PAGE) || 1;

  const paginatedGears = useMemo(() => gears.slice((inventoryPage - 1) * ITEMS_PER_PAGE, inventoryPage * ITEMS_PER_PAGE), [gears, inventoryPage]);
  const totalGearsPages = Math.ceil(gears.length / ITEMS_PER_PAGE) || 1;

  const paginatedBundles = useMemo(() => bundles.slice((bundlesPage - 1) * ITEMS_PER_PAGE, bundlesPage * ITEMS_PER_PAGE), [bundles, bundlesPage]);
  const totalBundlesPages = Math.ceil(bundles.length / ITEMS_PER_PAGE) || 1;

  const paginatedUsers = useMemo(() => users.slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE), [users, usersPage]);
  const totalUsersPages = Math.ceil(users.length / ITEMS_PER_PAGE) || 1;

  const cancelledBookings = useMemo(() => processedBookings.filter(b => b.status === 'cancelled'), [processedBookings]);
  const paginatedRefunds = useMemo(() => cancelledBookings.slice((refundsPage - 1) * ITEMS_PER_PAGE, refundsPage * ITEMS_PER_PAGE), [cancelledBookings, refundsPage]);
  const totalRefundsPages = Math.ceil(cancelledBookings.length / ITEMS_PER_PAGE) || 1;

  const updateBookingStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/api/admin/bookings/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Booking marked as ${newStatus}`);
      loadAdminData();
    } catch (error) {
      console.error("Error updating booking status", error);
      toast.error("Failed to update status");
    }
  };

  const processRefund = async (id: string) => {
    if (!window.confirm("Are you sure you want to mark this refund as processed?")) return;
    try {
      await api.put(`/api/admin/bookings/${id}/refund`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Refund marked as processed");
      loadAdminData();
    } catch (error) {
      console.error("Error processing refund", error);
      toast.error("Failed to process refund");
    }
  };

  const openModal = (gear?: GearData) => {
    if (gear) {
      setEditingGear(gear);
      setFormData({ name: gear.name, category: gear.category, pricePerDay: gear.pricePerDay, thumbnail: gear.thumbnail || '', images: gear.images || '[]' });
    } else {
      setEditingGear(null);
      setFormData({ name: '', category: 'Camera', pricePerDay: 0, thumbnail: '', images: '[]' });
    }
    setIsModalOpen(true);
  };

  const deleteGear = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this gear permanently?")) return;
    try {
      await api.delete(`/api/gears/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Gear removed from catalog");
      loadAdminData();
    } catch (error) {
      console.error("Error deleting gear", error);
      toast.error("Failed to delete gear");
    }
  };

  const openBundleModal = (bundle?: any) => {
    if (bundle) {
      setEditingBundle(bundle);
      setBundleFormData({ name: bundle.name, description: bundle.description, pricePerDay: bundle.pricePerDay, thumbnail: bundle.thumbnail || '', images: bundle.images || '[]', gearIds: bundle.gearIds || '[]' });
    } else {
      setEditingBundle(null);
      setBundleFormData({ name: '', description: '', pricePerDay: 0, thumbnail: '', images: '[]', gearIds: '[]' });
    }
    setIsBundleModalOpen(true);
  };

  const deleteBundle = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this bundle permanently?")) return;
    try {
      await api.delete(`/api/bundles/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Bundle removed from catalog");
      loadAdminData();
    } catch (error) {
      console.error("Error deleting bundle", error);
      toast.error("Failed to delete bundle");
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex-1 w-full py-4 pb-24 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1">Admin Center</h1>
          <p className="text-sm text-muted-foreground">Manage your platform</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAdminData(true)}
            disabled={isRefreshing}
            className="p-3 bg-surface border border-surface-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
          </button>
          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-colors"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Modern Mobile Horizontal Swipeable Tabs */}
      <div className="relative -mx-4 px-4 pb-2 pt-2">
        <div className="flex overflow-x-auto gap-2 pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {[
            { id: 'bookings', label: 'Overview' },
            { id: 'inventory', label: 'Inventory' },
            { id: 'bundles', label: 'Bundles' },
            { id: 'users', label: 'Users' },
            { id: 'refunds', label: 'Refunds' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`snap-center whitespace-nowrap px-5 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-sm ${
                activeTab === tab.id 
                  ? 'bg-accent text-white shadow-accent/20 scale-100' 
                  : 'bg-surface border border-surface-border text-muted-foreground hover:text-foreground scale-95'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'bookings' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Mobile KPI Cards Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface border border-surface-border p-4 rounded-2xl">
              <Activity className="h-4 w-4 text-accent mb-2" />
              <p className="text-xl font-black text-foreground">₹{(stats.totalRevenue/1000).toFixed(1)}k</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Revenue</p>
            </div>
            <div className="bg-surface border border-surface-border p-4 rounded-2xl">
              <FileText className="h-4 w-4 text-accent mb-2" />
              <p className="text-xl font-black text-foreground">{stats.activeRentals}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Active Runs</p>
            </div>
          </div>

          <div>
             <h2 className="text-lg font-bold text-foreground mb-4">Recent Bookings</h2>
             {processedBookings.length === 0 ? (
               <div className="bg-surface border border-surface-border rounded-3xl p-8 text-center">
                 <p className="text-sm font-bold text-muted-foreground">No bookings found</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {paginatedBookings.map((b) => (
                    <div 
                      key={b.id} 
                      className={`bg-surface border rounded-3xl p-5 transition-all cursor-pointer ${expandedBookingId === b.id ? 'border-accent shadow-md' : 'border-surface-border hover:border-accent/50'}`}
                      onClick={() => setExpandedBookingId(prev => prev === b.id ? null : b.id)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">#{b.id.slice(-8)}</span>
                            {b.undertakingSigned === 1 && (
                              <div className="h-3 w-3 rounded-full bg-green-500/20 flex items-center justify-center">
                                <CheckCircle className="h-2 w-2 text-green-500" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-bold text-foreground">{(b as any).customerName}</span>
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${b.status === 'confirmed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                          b.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                            'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                          {b.status}
                        </div>
                      </div>

                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-4">{new Date(b.startDate).toLocaleDateString()} to {new Date(b.endDate).toLocaleDateString()}</p>

                      <div className="flex justify-between items-center pt-4 border-t border-surface-border/50">
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          {b.status === 'pending' && (
                            <>
                              <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="text-[10px] font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Accept
                              </button>
                              <button onClick={() => updateBookingStatus(b.id, 'rejected')} className="text-[10px] font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                <XCircle className="h-3 w-3" /> Reject
                              </button>
                            </>
                          )}
                        </div>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedBookingId === b.id ? 'rotate-90 text-accent' : ''}`} />
                      </div>

                      {expandedBookingId === b.id && (
                        <div className="pt-4 mt-4 border-t border-surface-border/50 animate-in fade-in slide-in-from-top-2" onClick={e => e.stopPropagation()}>
                          <div className="text-[10px] text-muted-foreground space-y-1 bg-background p-3 rounded-xl border border-surface-border">
                            <div className="flex justify-between">
                              <span className="font-bold uppercase">Booking ID</span>
                              <span className="text-foreground font-mono">{b.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-bold uppercase">Created On</span>
                              <span className="text-foreground">{new Date(b.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                 ))}
                 <div className="pt-2">
                   <Pagination currentPage={bookingsPage} totalPages={totalBookingsPages} onPageChange={setBookingsPage} />
                 </div>
               </div>
             )}
          </div>
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center bg-surface border border-surface-border p-4 rounded-2xl">
            <div>
              <p className="text-xl font-black text-foreground">{stats.totalGear}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total Gear</p>
            </div>
            <button onClick={() => openModal()} className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-accent/20 hover:scale-105 transition-transform">
              <Plus className="h-4 w-4" /> Add Gear
            </button>
          </div>

          <div className="space-y-3">
            {paginatedGears.map((g) => (
              <div key={g.id} className="bg-surface border border-surface-border rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded bg-background border border-surface-border shrink-0 flex items-center justify-center overflow-hidden">
                    {g.thumbnail ? <img src={g.thumbnail} alt={g.name} className="h-full w-full object-cover" /> : <span className="text-[8px] text-muted-foreground">IMG</span>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground truncate max-w-[150px]">{g.name}</p>
                    <p className="text-xs text-accent font-bold">₹{g.pricePerDay} <span className="text-[10px] text-muted-foreground font-normal">/day</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(g)} className="p-2 bg-background border border-surface-border rounded-lg text-muted-foreground hover:text-accent"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => deleteGear(g.id)} className="p-2 bg-background border border-surface-border rounded-lg text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            <Pagination currentPage={inventoryPage} totalPages={totalGearsPages} onPageChange={setInventoryPage} />
          </div>
        </div>
      )}

      {/* BUNDLES TAB */}
      {activeTab === 'bundles' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex justify-between items-center bg-surface border border-surface-border p-4 rounded-2xl">
            <div>
              <p className="text-xl font-black text-foreground">{bundles.length}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Bundles</p>
            </div>
            <button onClick={() => openBundleModal()} className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-accent/20 hover:scale-105 transition-transform">
              <Plus className="h-4 w-4" /> Add Bundle
            </button>
          </div>

          <div className="space-y-3">
            {paginatedBundles.map((b) => (
              <div key={b.id} className="bg-surface border border-surface-border rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded bg-background border border-surface-border shrink-0 flex items-center justify-center overflow-hidden">
                    {b.thumbnail ? <img src={b.thumbnail} alt={b.name} className="h-full w-full object-cover" /> : <Package className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground truncate max-w-[150px]">{b.name}</p>
                    <p className="text-xs text-accent font-bold">₹{b.pricePerDay} <span className="text-[10px] text-muted-foreground font-normal">/day</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openBundleModal(b)} className="p-2 bg-background border border-surface-border rounded-lg text-muted-foreground hover:text-accent"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => deleteBundle(b.id)} className="p-2 bg-background border border-surface-border rounded-lg text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            {bundles.length === 0 && <p className="text-center text-sm text-muted-foreground p-4">No bundles created yet.</p>}
            <Pagination currentPage={bundlesPage} totalPages={totalBundlesPages} onPageChange={setBundlesPage} />
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface border border-surface-border p-4 rounded-2xl">
              <Users className="h-4 w-4 text-accent mb-2" />
              <p className="text-xl font-black text-foreground">{stats.totalUsers}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total Users</p>
            </div>
            <div className="bg-surface border border-surface-border p-4 rounded-2xl">
              <CheckCircle className="h-4 w-4 text-accent mb-2" />
              <p className="text-xl font-black text-foreground">{stats.admins}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Admins</p>
            </div>
          </div>

          <div className="space-y-3">
            {paginatedUsers.map((u) => (
              <div key={u.id} className="bg-surface border border-surface-border rounded-xl p-4 flex items-center justify-between leading-snug">
                <div>
                  <p className="text-sm font-bold text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${u.role === 'admin' ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-surface-border text-muted-foreground'}`}>
                  {u.role}
                </span>
              </div>
            ))}
            <Pagination currentPage={usersPage} totalPages={totalUsersPages} onPageChange={setUsersPage} />
          </div>
        </div>
      )}

      {/* REFUNDS TAB */}
      {activeTab === 'refunds' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-4">
            {paginatedRefunds.length === 0 ? (
               <div className="bg-surface border border-surface-border rounded-3xl p-8 text-center text-muted-foreground text-sm font-bold">
                 No cancelled bookings requiring refunds.
               </div>
            ) : paginatedRefunds.map((b) => (
              <div key={b.id} className="bg-surface border border-surface-border rounded-2xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-mono font-bold text-muted-foreground uppercase">{b.id.slice(-8)}</span>
                  </div>
                  <span className={`inline-flex px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border ${b.refundStatus === 'processed' ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'}`}>
                    Refund {b.refundStatus === 'processed' ? 'Processed' : 'Pending'}
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground">{(b as any).customerName}</p>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-surface-border/50">
                  <span className="text-[10px] text-muted-foreground uppercase">{new Date(b.createdAt).toLocaleDateString()}</span>
                  {b.refundStatus !== 'processed' && (
                    <button onClick={() => processRefund(b.id)} className="flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/10 hover:bg-accent hover:text-white transition-colors px-3 py-1.5 rounded-lg">
                      <RotateCcw className="h-3 w-3" /> Mark Processed
                    </button>
                  )}
                </div>
              </div>
            ))}
            {paginatedRefunds.length > 0 && <Pagination currentPage={refundsPage} totalPages={totalRefundsPages} onPageChange={setRefundsPage} />}
          </div>
        </div>
      )}

      <AdminModals 
        isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} editingGear={editingGear} 
        formData={formData} setFormData={setFormData} isUploading={isUploading} 
        handleFileUpload={handleFileUpload} handleGearSubmit={handleGearSubmit}
        isBundleModalOpen={isBundleModalOpen} setIsBundleModalOpen={setIsBundleModalOpen} 
        editingBundle={editingBundle} bundleFormData={bundleFormData} setBundleFormData={setBundleFormData} 
        handleBundleSubmit={handleBundleSubmit} gears={gears}
      />
    </div>
  );
}
