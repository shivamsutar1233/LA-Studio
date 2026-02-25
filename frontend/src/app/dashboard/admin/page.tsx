"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Users, FileText, Activity, Plus, Edit2, Trash2, CheckCircle, XCircle, UploadCloud, Eye, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AdminBooking {
  id: string;
  userId: string;
  gearIds: string; // JSON array string
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

export default function AdminDashboard() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'bookings' | 'inventory' | 'users'>('bookings');
  
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [gears, setGears] = useState<GearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGear, setEditingGear] = useState<GearData | null>(null);
  const [viewingBooking, setViewingBooking] = useState<AdminBooking | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', category: 'Camera', pricePerDay: 0, thumbnail: '', images: '[]' });
  const [isUploading, setIsUploading] = useState(false);

  const loadAdminData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const [bookingsRes, gearsRes] = await Promise.all([
        api.get('/api/admin/bookings', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/gears')
      ]);
      setBookings(bookingsRes.data.bookings || []);
      setUsers(bookingsRes.data.users || []);
      setGears(gearsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch admin data", error);
    } finally {
      if (isManualRefresh) setIsRefreshing(false);
      else setLoading(false);
    }
  };

  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return; // Wait for Zustand to load from localStorage

    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    loadAdminData();
    
    (window as any).refreshAdminDashboard = () => loadAdminData(true);
    
    return () => {
      delete (window as any).refreshAdminDashboard;
    }
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
      toast.error("Upload failed. Check console and Blob token.");
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input so same files can be selected again
    }
  };

  const handleGearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGear) {
        // Update
        await api.put(`/api/gears/${editingGear.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Gear updated successfully");
      } else {
        // Create
        await api.post('/api/gears', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("New gear added successfully");
      }
      setIsModalOpen(false);
      loadAdminData(); // Refresh table
    } catch (error) {
      console.error("Error saving gear", error);
      toast.error("Failed to save gear");
    }
  };

  const deleteGear = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this gear permanently?")) return;
    try {
      await api.delete(`/api/gears/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Gear removed from catalog");
      loadAdminData(); // Refresh table
    } catch (error) {
      console.error("Error deleting gear", error);
      toast.error("Failed to delete gear");
    }
  };

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


  if (loading) {
    return <div className="flex-1 flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-12 relative">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Admin Control Center</h1>
          <p className="text-muted-foreground">Manage your platform inventory, users, and all system bookings.</p>
        </div>
        <div className="flex bg-surface border border-surface-border p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${activeTab === 'bookings' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Overview & Bookings
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${activeTab === 'inventory' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Inventory Management
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${activeTab === 'users' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Users Directory
          </button>
        </div>
      </div>

      {activeTab === 'bookings' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-surface border border-surface-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4 text-muted-foreground">
                <h3 className="font-semibold text-sm uppercase tracking-wider">Total Revenue</h3>
                <Activity className="h-5 w-5 text-accent" />
              </div>
              <p className="text-3xl font-black text-foreground">₹{stats.totalRevenue.toLocaleString()}</p>
              <span className="text-xs text-green-500 font-medium">Est. Lifecycle Value</span>
            </div>
            
            <div className="bg-surface border border-surface-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4 text-muted-foreground">
                <h3 className="font-semibold text-sm uppercase tracking-wider">Active Bookings</h3>
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <p className="text-3xl font-black text-foreground">{stats.activeRentals}</p>
              <span className="text-xs text-muted-foreground">Platform-wide</span>
            </div>
            
            <div className="bg-surface border border-surface-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4 text-muted-foreground">
                <h3 className="font-semibold text-sm uppercase tracking-wider">Registered Users</h3>
                <Users className="h-5 w-5 text-accent" />
              </div>
              <p className="text-3xl font-black text-foreground">{stats.totalUsers}</p>
              <span className="text-xs text-muted-foreground">{stats.admins} Admins vs {stats.totalUsers - stats.admins} Users</span>
            </div>
          </div>

          <div className="w-full">
            {/* Master Booking Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Master Booking Ledger</h2>
                <button 
                  onClick={() => (window as any).refreshAdminDashboard?.()}
                  disabled={isRefreshing}
                  className="p-2 mr-2 rounded-full hover:bg-surface border border-transparent hover:border-surface-border text-muted-foreground hover:text-foreground transition-all disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                  title="Refresh Bookings"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
              <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border bg-background/50">
                      <th className="p-4 text-xs font-semibold text-muted-foreground uppercase">ID</th>
                      <th className="p-4 text-xs font-semibold text-muted-foreground uppercase">Customer</th>
                      <th className="p-4 text-xs font-semibold text-muted-foreground uppercase">Item</th>
                      <th className="p-4 text-xs font-semibold text-muted-foreground uppercase">Dates</th>
                      <th className="p-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                      <th className="p-4 text-xs font-semibold text-muted-foreground uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {bookings.length > 0 ? bookings.map((b) => {
                      const gearListStr = b.gearIds ? (() => {
                        try {
                          const ids = JSON.parse(b.gearIds);
                          if (Array.isArray(ids)) {
                            return ids.map((item: any) => {
                                if (typeof item === 'string') {
                                    return gears.find(g => g.id === item)?.name || 'Unknown Gear';
                                } else if (item && item.id) {
                                    const qtyStr = item.quantity && item.quantity > 1 ? ` x${item.quantity}` : '';
                                    return `${item.name}${qtyStr} (${item.days} days)`;
                                }
                                return 'Unknown Item';
                            }).join(', ');
                          }
                          return 'Invalid format';
                        } catch(e) {
                           return gears.find(g => g.id === b.gearIds)?.name || 'Legacy Gear Entry';
                        }
                      })() : 'No Gear';

                      return (
                      <tr key={b.id} className="hover:bg-background/30 transition-colors">
                        <td className="p-4 text-sm font-mono text-muted-foreground">#{b.id}</td>
                        <td className="p-4 text-sm font-medium text-foreground">
                          {users.find(u => u.id === b.userId)?.name || b.customerDetails?.name || 'Guest Checkout'}
                        </td>
                        <td className="p-4 text-sm font-medium text-accent max-w-[200px]" title={gearListStr}>
                          <div className="truncate">
                            {gearListStr}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-foreground">{b.startDate} to {b.endDate}</td>
                        <td className="p-4 text-sm">
                          <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            b.status === 'confirmed' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                            b.status === 'rejected' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                            'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-4 flex items-center justify-end gap-2">
                          <button onClick={() => setViewingBooking(b)} className="p-2 text-muted-foreground hover:text-accent bg-background rounded-lg border border-surface-border transition-colors group" title="View Order Details">
                            <Eye className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          </button>
                          {b.status === 'pending' && (
                            <>
                              <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="p-2 text-muted-foreground hover:text-green-500 bg-background rounded-lg border border-surface-border transition-colors group" title="Accept Booking">
                                <CheckCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                              </button>
                              <button onClick={() => updateBookingStatus(b.id, 'rejected')} className="p-2 text-muted-foreground hover:text-red-500 bg-background rounded-lg border border-surface-border transition-colors group" title="Reject Booking">
                                <XCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">No bookings found on the platform.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* INVENTORY MANAGEMENT TAB */}
      {activeTab === 'inventory' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Gear Catalog ({stats.totalGear})</h2>
            <button 
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl font-bold hover:bg-accent-hover transition-colors shadow-md shadow-accent/20"
            >
              <Plus className="h-5 w-5" /> Add New Gear
            </button>
          </div>

          <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-background/50">
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item Name</th>
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price/Day</th>
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {gears.map((g) => (
                  <tr key={g.id} className="hover:bg-background/30 transition-colors">
                    <td className="p-4 text-xs font-mono text-muted-foreground">#{g.id}</td>
                    <td className="p-4 text-sm font-bold text-foreground flex items-center gap-3">
                       <div className="h-8 w-8 rounded bg-background border border-surface-border shrink-0 flex items-center justify-center overflow-hidden">
                          {g.thumbnail ? <img src={g.thumbnail} alt={g.name} className="h-full w-full object-cover opacity-50" /> : <span className="text-[8px] text-muted-foreground">IMG</span>}
                       </div>
                       {g.name}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{g.category}</td>
                    <td className="p-4 text-sm font-bold text-foreground">₹{g.pricePerDay}</td>
                    <td className="p-4 flex items-center justify-end gap-2">
                       <button onClick={() => openModal(g)} className="p-2 text-muted-foreground hover:text-accent bg-background rounded-lg border border-surface-border transition-colors group" title="Edit Gear">
                          <Edit2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                       </button>
                       <button onClick={() => deleteGear(g.id)} className="p-2 text-muted-foreground hover:text-red-500 bg-background rounded-lg border border-surface-border transition-colors group" title="Delete Gear">
                          <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USERS DIRECTORY TAB */}
      {activeTab === 'users' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">User Directory ({stats.totalUsers})</h2>
          </div>

          <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-background/50">
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name / Email</th>
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {users.length > 0 ? users.map((u) => (
                  <tr key={u.id} className="hover:bg-background/30 transition-colors">
                    <td className="p-4 text-xs font-mono text-muted-foreground">#{u.id}</td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="p-4 text-right flex justify-end">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        u.role === 'admin' ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-surface-border text-muted-foreground'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-sm text-muted-foreground">No users registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Gear Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-surface-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-surface-border flex justify-between items-center">
              <h3 className="text-xl font-bold text-foreground">{editingGear ? 'Edit Gear Item' : 'Add New Gear'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            
            <form onSubmit={handleGearSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1">Item Name</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-xl border border-surface-border bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" 
                  placeholder="e.g. GoPro Hero 12 Black"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full rounded-xl border border-surface-border bg-surface px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="Camera">Camera</option>
                    <option value="Audio">Audio</option>
                    <option value="Mounts">Mounts</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">Price per Day (₹)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({...formData, pricePerDay: parseInt(e.target.value) || 0})}
                    className="w-full rounded-xl border border-surface-border bg-surface px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" 
                    placeholder="25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1">Primary Thumbnail</label>
                <div className="flex items-center gap-4">
                  {formData.thumbnail && (
                    <img src={formData.thumbnail} alt="Thumbnail preview" className="h-12 w-12 rounded object-cover border border-surface-border" />
                  )}
                  <label className="cursor-pointer flex-1 flex items-center justify-between rounded-xl border border-surface-border bg-surface px-4 py-3 text-foreground focus-within:border-accent focus-within:ring-1 focus-within:ring-accent hover:bg-surface-border transition-colors">
                    <span className="text-sm text-muted-foreground truncate flex-1">{formData.thumbnail || 'Select image file...'}</span>
                    <UploadCloud className="h-5 w-5 text-accent shrink-0 ml-2" />
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'thumbnail')}
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1 flex justify-between">
                  <span>Additional Images (Gallery)</span>
                  <span className="text-xs text-muted-foreground">{JSON.parse(formData.images || '[]').length} uploaded</span>
                </label>
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer flex items-center justify-center w-full rounded-xl border border-dashed border-surface-border bg-surface px-4 py-6 text-foreground hover:border-accent hover:bg-surface-border transition-colors">
                    <div className="flex flex-col items-center gap-2">
                      <UploadCloud className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium">Click to upload multiple images</span>
                    </div>
                    <input 
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'images')}
                      className="hidden" 
                    />
                  </label>
                  {formData.images !== '[]' && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {JSON.parse(formData.images).map((imgUrl: string, idx: number) => (
                        <div key={idx} className="relative h-12 w-12 shrink-0 group">
                          <img src={imgUrl} alt={`Gallery ${idx}`} className="h-full w-full rounded object-cover border border-surface-border" />
                          <button 
                            type="button"
                            onClick={() => {
                              const imgs = JSON.parse(formData.images);
                              imgs.splice(idx, 1);
                              setFormData(prev => ({ ...prev, images: JSON.stringify(imgs) }));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow hidden group-hover:block"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-surface text-foreground font-bold py-3 rounded-xl border border-surface-border hover:bg-surface-border transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20 disabled:opacity-50"
                >
                  {isUploading ? <><Loader2 className="h-5 w-5 animate-spin mr-2 inline" /> Uploading...</> : editingGear ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal Redesign */}
      {viewingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-surface-border rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-surface-border flex justify-between items-center bg-background top-0 sticky z-10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Order Details</h3>
                  <p className="text-sm font-mono text-muted-foreground flex items-center gap-2">
                    ID: #{viewingBooking.id}
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      viewingBooking.status === 'confirmed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      viewingBooking.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                      {viewingBooking.status}
                    </span>
                  </p>
                </div>
              </div>
              <button onClick={() => setViewingBooking(null)} className="text-muted-foreground hover:text-foreground hover:bg-surface-border p-2 rounded-full transition-colors">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-surface">
              
              {/* Verification Banner */}
              <div className="w-full">
                {viewingBooking.undertakingSigned === 1 ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-green-500">Identity Verified & Undertaking Signed</h4>
                        <p className="text-sm text-foreground font-medium mt-0.5">Aadhaar: <span className="font-mono tracking-widest bg-background px-1.5 py-0.5 rounded border border-surface-border/50">{viewingBooking.aadhaarNumber}</span></p>
                      </div>
                    </div>
                    {viewingBooking.aadhaarUrl && (
                      <a href={viewingBooking.aadhaarUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 bg-background border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-white px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-sm">
                        <FileText className="h-4 w-4" /> View KYC Document
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                      <Activity className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-yellow-500">Verification Pending</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">Customer has not yet signed the undertaking or provided Aadhaar details.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Top Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Customer Card */}
                <div className="bg-background border border-surface-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer Details</h4>
                  </div>
                  <p className="text-lg font-black text-foreground truncate">{users.find(u => u.id === viewingBooking.userId)?.name || viewingBooking.customerDetails?.name || 'Guest Checkout'}</p>
                  <p className="text-sm text-muted-foreground truncate">{users.find(u => u.id === viewingBooking.userId)?.email || 'No email provided'}</p>
                </div>
                
                {/* Delivery Card */}
                <div className="bg-background border border-surface-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fulfillment</h4>
                  </div>
                  {viewingBooking.deliveryAddress ? (
                    <div>
                       <p className="font-bold text-foreground text-sm truncate">{viewingBooking.deliveryAddress.street}</p>
                       <p className="text-sm text-muted-foreground truncate">{viewingBooking.deliveryAddress.city}, {viewingBooking.deliveryAddress.state} {viewingBooking.deliveryAddress.zip}</p>
                    </div>
                  ) : (
                    <div className="h-full flex items-center">
                      <p className="text-sm font-medium text-muted-foreground italic bg-surface px-3 py-1 rounded-lg border border-surface-border">Studio Pickup</p>
                    </div>
                  )}
                </div>

                {/* Dates Card */}
                <div className="bg-background border border-surface-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rental Period</h4>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">From:</span>
                      <span className="font-bold text-foreground">{viewingBooking.startDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">To:</span>
                      <span className="font-bold text-foreground">{viewingBooking.endDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gear List */}
              <div className="bg-background border border-surface-border rounded-2xl p-6 shadow-sm">
                <h4 className="text-base font-black text-foreground mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-accent" />
                  Included Equipment
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    let gearItems: any[] = [];
                    try {
                      gearItems = JSON.parse(viewingBooking.gearIds);
                      if (!Array.isArray(gearItems)) gearItems = [viewingBooking.gearIds];
                    } catch {
                      gearItems = [viewingBooking.gearIds];
                    }

                    return gearItems.map((item, idx) => {
                      const isObject = typeof item === 'object' && item !== null;
                      const id = isObject ? item.id : item;
                      const gear = gears.find(g => g.id === id);
                      
                      const itemStartDate = isObject && item.startDate ? item.startDate : viewingBooking.startDate;
                      const itemEndDate = isObject && item.endDate ? item.endDate : viewingBooking.endDate;
                      
                      const msPerDay = 1000 * 60 * 60 * 24;
                      let calcDays = 1;
                      if (itemStartDate && itemEndDate) {
                         const diff = Math.ceil((new Date(itemEndDate).getTime() - new Date(itemStartDate).getTime()) / msPerDay);
                         calcDays = diff > 0 ? diff : 0;
                      }
                      const itemDays = isObject && item.days ? item.days : calcDays;
                      const itemPrice = isObject && item.pricePerDay ? item.pricePerDay : (gear?.pricePerDay || 0);
                      const itemQty = isObject && item.quantity ? item.quantity : 1;
                      const totalItemPrice = itemPrice * itemDays * itemQty;

                      return (
                        <div key={idx} className="flex flex-col sm:flex-row gap-4 bg-surface border border-surface-border p-4 rounded-2xl hover:border-accent/30 transition-colors group">
                          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl bg-background border border-surface-border shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
                            {gear?.thumbnail ? <img src={gear.thumbnail} alt={gear.name || 'Gear'} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <span className="text-[10px] text-muted-foreground font-bold">NO IMG</span>}
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                              <p className="font-bold text-base text-foreground mb-1 leading-tight line-clamp-2">
                                {isObject ? item.name : (gear?.name || 'Unknown Gear ID: ' + id)} 
                              </p>
                              <div className="inline-flex bg-background border border-surface-border rounded-lg px-2 py-1 text-xs font-bold text-muted-foreground">
                                Qty: <span className="text-foreground ml-1">{itemQty}</span>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex items-end justify-between border-t border-surface-border/50 pt-2">
                              <div>
                                <p className="text-xs text-muted-foreground font-medium mb-0.5">{itemDays} Days @ ₹{itemPrice}</p>
                              </div>
                              <p className="font-black text-lg text-accent">₹{totalItemPrice.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-5 border-t border-surface-border bg-background flex justify-end gap-3 shrink-0">
               {viewingBooking.status === 'pending' && (
                 <>
                  <button 
                    onClick={() => { updateBookingStatus(viewingBooking.id, 'rejected'); setViewingBooking(null); }}
                    className="px-6 py-2.5 rounded-xl border border-red-500/30 text-red-500 font-bold hover:bg-red-500/10 transition-colors"
                  >
                    Reject Order
                  </button>
                  <button 
                    onClick={() => { updateBookingStatus(viewingBooking.id, 'confirmed'); setViewingBooking(null); }}
                    className="px-6 py-2.5 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" /> Approve Order
                  </button>
                 </>
               )}
               {viewingBooking.status !== 'pending' && (
                 <button 
                   onClick={() => setViewingBooking(null)}
                   className="px-8 py-2.5 rounded-xl bg-surface border border-surface-border text-foreground font-bold hover:bg-surface-border transition-colors"
                 >
                   Done
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
