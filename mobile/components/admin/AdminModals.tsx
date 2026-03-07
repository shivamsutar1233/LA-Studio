"use client";

import { useState } from 'react';
import { Plus, X, UploadCloud, Loader2, Link2, Monitor, Camera, Package, Info } from 'lucide-react';
import { toast } from 'sonner';

interface AdminModalsProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  editingGear: any;
  formData: any;
  setFormData: (data: any) => void;
  isUploading: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, field: 'thumbnail' | 'images') => void;
  handleGearSubmit: (e: React.FormEvent) => void;

  isBundleModalOpen: boolean;
  setIsBundleModalOpen: (open: boolean) => void;
  editingBundle: any;
  bundleFormData: any;
  setBundleFormData: (data: any) => void;
  handleBundleSubmit: (e: React.FormEvent) => void;

  gears: any[];
}

export function AdminModals({
  isModalOpen, setIsModalOpen, editingGear, formData, setFormData, isUploading, handleFileUpload, handleGearSubmit,
  isBundleModalOpen, setIsBundleModalOpen, editingBundle, bundleFormData, setBundleFormData, handleBundleSubmit, gears
}: AdminModalsProps) {

  if (!isModalOpen && !isBundleModalOpen) return null;

  return (
    <>
      {/* GEAR MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-surface border border-surface-border rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-5 fade-in duration-300">
            <div className="sticky top-0 bg-surface/80 backdrop-blur-md z-10 border-b border-surface-border p-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-foreground">{editingGear ? 'Edit Gear' : 'Add New Gear'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-background border border-surface-border rounded-full text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGearSubmit} className="p-6 space-y-6">
              {/* Image Upload Area */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Thumbnail Image</label>
                  <div className="relative border-2 border-dashed border-surface-border rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:border-accent hover:bg-accent/5 transition-colors group aspect-square">
                    <input type="file" onChange={(e) => handleFileUpload(e, 'thumbnail')} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" disabled={isUploading} />
                    {formData.thumbnail ? (
                      <div className="relative w-full h-full">
                        <img src={formData.thumbnail} alt="Thumbnail preview" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-xs font-bold text-foreground">Change</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="h-8 w-8 text-muted-foreground mb-2 group-hover:text-accent transition-colors" />
                        <span className="text-xs font-medium text-muted-foreground">Tap to upload primary image</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gallery Images</label>
                  <div className="relative border-2 border-dashed border-surface-border rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:border-accent hover:bg-accent/5 transition-colors group aspect-square">
                    <input type="file" multiple onChange={(e) => handleFileUpload(e, 'images')} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" disabled={isUploading} />
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 text-accent animate-spin" />
                        <span className="text-xs font-medium text-foreground">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <Plus className="h-8 w-8 text-muted-foreground mb-2 group-hover:text-accent transition-colors" />
                        <span className="text-xs font-medium text-muted-foreground">{JSON.parse(formData.images || '[]').length} images added. Tap to add more</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Gear Name</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} type="text" className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors" placeholder="e.g., Sony A7IV Body" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent transition-colors appearance-none">
                    <option value="Camera">Camera</option>
                    <option value="Lens">Lens</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Audio">Audio</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Computer">Computer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Price Per Day (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                    <input required min="0" value={formData.pricePerDay || ''} onChange={e => setFormData({ ...formData, pricePerDay: Number(e.target.value) })} type="number" className="w-full bg-background border border-surface-border rounded-xl pl-8 pr-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors" placeholder="1500" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-surface-border sticky bottom-0 bg-surface/90 backdrop-blur pb-4">
                <button type="submit" disabled={isUploading} className="w-full bg-accent text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-accent/20">
                  {isUploading ? <><Loader2 className="h-5 w-5 animate-spin" /> Uploading Media...</> : editingGear ? 'Save Changes' : 'Create Gear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BUNDLE MODAL */}
      {isBundleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-surface border border-surface-border rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-5 fade-in duration-300">
            <div className="sticky top-0 bg-surface/80 backdrop-blur-md z-10 border-b border-surface-border p-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-foreground">{editingBundle ? 'Edit Bundle' : 'Create Bundle'}</h2>
              <button type="button" onClick={() => setIsBundleModalOpen(false)} className="p-2 bg-background border border-surface-border rounded-full text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBundleSubmit} className="p-6 space-y-6">
              {/* Image Upload Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bundle Thumbnail</label>
                <div className="relative border-2 border-dashed border-surface-border rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-accent hover:bg-accent/5 transition-colors group">
                  <input type="file" onChange={(e) => handleFileUpload(e, 'thumbnail')} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" disabled={isUploading} />
                  {bundleFormData.thumbnail ? (
                    <div className="relative h-32 w-full">
                      <img src={bundleFormData.thumbnail} alt="Thumbnail preview" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs font-bold text-foreground">Change Image</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="h-8 w-8 text-muted-foreground mb-2 group-hover:text-accent transition-colors" />
                      <span className="text-xs font-medium text-muted-foreground">Tap to upload primary bundle image</span>
                    </>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Bundle Name</label>
                  <input required value={bundleFormData.name} onChange={e => setBundleFormData({ ...bundleFormData, name: e.target.value })} type="text" className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors" placeholder="e.g., Wedding Filmmaker Kit" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Description</label>
                  <textarea value={bundleFormData.description} onChange={e => setBundleFormData({ ...bundleFormData, description: e.target.value })} rows={3} className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors resize-none" placeholder="Perfect kit for capturing wide and tight shots..."></textarea>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Bundle Price Per Day (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                    <input required min="0" value={bundleFormData.pricePerDay || ''} onChange={e => setBundleFormData({ ...bundleFormData, pricePerDay: Number(e.target.value) })} type="number" className="w-full bg-background border border-surface-border rounded-xl pl-8 pr-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors" placeholder="3500" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Included Gear ({(() => { try { return JSON.parse(bundleFormData.gearIds).length } catch { return 0 } })()})</label>
                <div className="bg-background border border-surface-border rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2">
                  {gears.map(g => {
                    const isSelected = (() => {
                      try { return JSON.parse(bundleFormData.gearIds).includes(g.id) } catch { return false }
                    })();
                    return (
                      <label key={g.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'bg-accent/10 border-accent/20' : 'border-surface-border hover:bg-surface'}`}>
                        <input
                          type="checkbox"
                          className="accent-accent h-4 w-4 rounded border-surface-border"
                          checked={isSelected}
                          onChange={(e) => {
                            try {
                              let current = JSON.parse(bundleFormData.gearIds);
                              if (e.target.checked) current.push(g.id);
                              else current = current.filter((id: string) => id !== g.id);
                              setBundleFormData({ ...bundleFormData, gearIds: JSON.stringify(current) });
                            } catch (err) {
                              setBundleFormData({ ...bundleFormData, gearIds: JSON.stringify([g.id]) });
                            }
                          }}
                        />
                        <div className="h-8 w-8 bg-surface rounded flex items-center justify-center shrink-0">
                          {g.thumbnail ? <img src={g.thumbnail} alt="" className="h-full w-full object-contain" /> : <Camera className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{g.name}</p>
                          <p className="text-[10px] text-muted-foreground">₹{g.pricePerDay}/day</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-surface-border sticky bottom-0 bg-surface/90 backdrop-blur pb-4">
                <button type="submit" disabled={isUploading} className="w-full bg-accent text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-accent/20">
                  {isUploading ? <><Loader2 className="h-5 w-5 animate-spin" /> Uploading Media...</> : editingBundle ? 'Save Bundle' : 'Create Bundle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
