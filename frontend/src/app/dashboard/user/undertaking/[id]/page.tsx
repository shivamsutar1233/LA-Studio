"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { FileSignature, ShieldCheck, UploadCloud, ArrowLeft, Loader2, CheckCircle, Package } from 'lucide-react';
import { toast } from 'sonner';

interface BookingData {
  id: string;
  gearIds: string;
  startDate: string;
  endDate: string;
  status: string;
  undertakingSigned: number;
}

interface GearDetails {
  [key: string]: { name: string; thumbnail?: string };
}

export default function UndertakingPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [gearInfo, setGearInfo] = useState<GearDetails>({});
  
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [clientId, setClientId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch User Bookings to find this specific one
        const bookingsRes = await api.get('/api/bookings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const foundBooking = bookingsRes.data.find((b: any) => b.id === bookingId);
        if (!foundBooking) {
          toast.error("Booking not found");
          router.push('/dashboard/user');
          return;
        }

        if (foundBooking.undertakingSigned === 1) {
          toast.info("Undertaking already signed for this booking.");
          router.push('/dashboard/user');
          return;
        }

        setBooking(foundBooking);

        // Fetch Gear Details
        try {
          const gearRes = await api.get('/api/gears');
          const gearMap: GearDetails = {};
          if (Array.isArray(gearRes.data)) {
            gearRes.data.forEach((g: any) => {
              gearMap[g.id] = { name: g.name, thumbnail: g.thumbnail };
            });
          }
          setGearInfo(gearMap);
        } catch (err) {
          console.error("Failed to fetch gear map:", err);
        }
      } catch (error) {
        console.error("Failed to fetch booking details:", error);
        toast.error("Failed to load details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token, router, hasHydrated, bookingId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Check file size (max 5MB)
    if (files[0].size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setAadhaarFile(files[0]);
  };

  const handleGenerateOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate Aadhaar (exactly 12 digits)
    const strippedAadhaar = aadhaarNumber.replace(/\s+/g, '');
    if (!/^\d{12}$/.test(strippedAadhaar)) {
      toast.error("Aadhaar Number must be exactly 12 digits");
      return;
    }

    if (!aadhaarFile) {
      toast.error("Please upload a scanned copy of your Aadhaar Card");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload the file first
      let fileUrl = uploadedFileUrl;
      if (!fileUrl) {
         setIsUploading(true);
         const formData = new FormData();
         formData.append('file', aadhaarFile);
         
         const uploadRes = await api.post('/api/user/upload', formData, {
           headers: { Authorization: `Bearer ${token}` }
         });
         fileUrl = uploadRes.data.url;
         setUploadedFileUrl(fileUrl);
         setIsUploading(false);
      }

      // 2. Generate OTP
      const res = await api.post(`/api/bookings/${bookingId}/aadhaar/generate-otp`, {
        aadhaarNumber: strippedAadhaar
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setClientId(res.data.clientId);
      setOtpSent(true);
      toast.success(res.data.message || "OTP Sent to registered mobile number");
    } catch (error: any) {
      console.error("Generate OTP error", error);
      setIsUploading(false);
      toast.error(error.response?.data?.message || "Failed to generate OTP or upload file");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpCode || otpCode.length < 4) {
      toast.error("Please enter a valid OTP");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const strippedAadhaar = aadhaarNumber.replace(/\s+/g, '');
      const res = await api.post(`/api/bookings/${bookingId}/aadhaar/submit-otp`, {
        clientId,
        otp: otpCode,
        aadhaarNumber: strippedAadhaar,
        aadhaarUrl: uploadedFileUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(res.data.message || "Aadhaar verified and undertaking signed!", { icon: <CheckCircle className="text-green-500 h-5 w-5" /> });
      router.push('/dashboard/user');
      
    } catch (error: any) {
      console.error("Verify OTP error", error);
      toast.error(error.response?.data?.message || "Failed to verify OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !booking) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const formatAadhaarInput = (value: string) => {
    // Strip all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Format as XXXX XXXX XXXX
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || v;
    const parts = [];
    for (let i=0, len=match.length; i<len; i+=4) {
      parts.push(match.substring(i, i+4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Resolve gear names for display
  const gearListStr = (() => {
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
      return gearInfo[booking.gearIds]?.name || 'Legacy Gear Entry';
    }
  })();

  return (
    <div className="min-h-[80vh] flex flex-col py-12 px-4 bg-background">
      <div className="max-w-3xl mx-auto w-full">
        
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center justify-center p-3 bg-accent/10 rounded-2xl mb-4">
            <FileSignature className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2">Booking Undertaking</h1>
          <p className="text-muted-foreground text-lg">Please complete the Aadhaar verification below to release the gear.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Left Column: Summary Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2 border-b border-surface-border pb-3">
                <ShieldCheck className="h-5 w-5 text-accent" /> Terms of Rental
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <li className="flex gap-2"><span className="text-accent">•</span> The renter holds full responsibility for the gear during the specified dates.</li>
                <li className="flex gap-2"><span className="text-accent">•</span> Any damage or loss will be entirely compensated by the renter at market value.</li>
                <li className="flex gap-2"><span className="text-accent">•</span> Delays in return will attract a late penalty equal to 1.5x the daily rental rate.</li>
                <li className="flex gap-2"><span className="text-accent">•</span> An original, valid ID must be uploaded below.</li>
              </ul>
            </div>

            <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-foreground mb-2 flex items-center gap-2 border-b border-surface-border pb-3">
                <Package className="h-5 w-5 text-muted-foreground" /> Booking Overview
              </h3>
              
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Renter (You)</p>
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Rental Period</p>
                <p className="text-sm font-medium text-foreground">{booking.startDate} &rarr; {booking.endDate}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Items</p>
                <p className="text-sm font-medium text-foreground leading-snug">{gearListStr}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="md:col-span-3">
            <div className="bg-surface/50 border border-surface-border rounded-3xl p-6 md:p-8 shadow-md transition-all duration-300">
              
              {!otpSent ? (
                // STEP 1: GENERATE OTP
                <form onSubmit={handleGenerateOTP} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Aadhaar Number <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      maxLength={14} // 12 digits + 2 spaces
                      placeholder="XXXX XXXX XXXX"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(formatAadhaarInput(e.target.value))}
                      className="w-full rounded-xl border border-surface-border bg-background px-4 py-3 text-lg font-mono tracking-widest text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all" 
                    />
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> We will send an OTP to the mobile number linked to this Aadhaar.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Aadhaar Document Upload <span className="text-red-500">*</span></label>
                    
                    <label className={`cursor-pointer flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed ${aadhaarFile ? 'border-accent bg-accent/5' : 'border-surface-border bg-background hover:bg-surface hover:border-accent/50'} px-6 py-10 transition-all duration-200 group relative overflow-hidden`}>
                      
                      <input 
                        type="file"
                        accept="image/*,application/pdf"
                        required
                        onChange={handleFileUpload}
                        className="hidden" 
                      />
                      
                      {aadhaarFile ? (
                        <div className="flex flex-col items-center text-center space-y-2">
                          <CheckCircle className="h-10 w-10 text-accent mb-2" />
                          <span className="text-sm font-bold text-foreground">{aadhaarFile.name}</span>
                          <span className="text-xs text-muted-foreground">{(aadhaarFile.size / 1024 / 1024).toFixed(2)} MB • Click to replace</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="p-4 rounded-full bg-surface group-hover:bg-background transition-colors">
                            <UploadCloud className="h-8 w-8 text-muted-foreground group-hover:text-accent transition-colors" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">Click to upload or drag & drop</p>
                            <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, or PDF (Max 5MB)</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="mt-10 pt-6 border-t border-surface-border">
                    <button 
                      type="submit"
                      disabled={isSubmitting || aadhaarNumber.replace(/\s+/g, '').length !== 12 || !aadhaarFile}
                      className="w-full bg-accent text-white font-bold py-4 rounded-xl hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 hover:shadow-accent/40 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                      <span className={`relative z-10 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-0' : 'opacity-100'}`}>
                        Upload & Send OTP
                      </span>
                      
                      {isSubmitting && (
                        <div className="absolute inset-0 flex items-center justify-center bg-accent">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" /> 
                          {isUploading ? 'Uploading Document...' : 'Connecting to Aadhaar API...'}
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                // STEP 2: VERIFY OTP
                <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center mb-6">
                    <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-foreground">OTP Sent Successfully</p>
                    <p className="text-xs text-muted-foreground mt-1">Sent to the mobile number registered with Aadhaar ending in {aadhaarNumber.slice(-4)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Enter OTP <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-xl border border-surface-border bg-background px-4 py-3 text-2xl text-center font-mono tracking-[0.5em] text-foreground placeholder:text-muted-foreground/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all" 
                    />
                    <div className="flex justify-between items-center mt-2">
                       <p className="text-xs text-muted-foreground">Enter the 6-digit code.</p>
                       <button type="button" onClick={() => handleGenerateOTP()} disabled={isSubmitting} className="text-xs font-bold text-accent hover:underline disabled:opacity-50">Resend OTP</button>
                    </div>
                  </div>

                  <div className="mt-10 border-t border-surface-border pt-6">
                    <label className="flex items-start gap-3 cursor-pointer mb-6 group">
                      <div className="mt-0.5">
                        <input type="checkbox" required className="w-4 h-4 rounded border-surface-border text-accent focus:ring-accent cursor-pointer" />
                      </div>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                        I declare that the information provided is accurate and corresponds to the individual making this reservation. I accept the liability terms mentioned alongside for this gear rental via this e-KYC digital signature.
                      </span>
                    </label>

                    <button 
                      type="submit"
                      disabled={isSubmitting || otpCode.length < 4}
                      className="w-full bg-accent text-white font-bold py-4 rounded-xl hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 hover:shadow-accent/40 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                      <span className={`relative z-10 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-0' : 'opacity-100'}`}>
                        Verify OTP & E-Sign Undertaking
                      </span>
                      
                      {isSubmitting && (
                        <div className="absolute inset-0 flex items-center justify-center bg-accent">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Verifying OTP...
                        </div>
                      )}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setOtpSent(false); setOtpCode(''); }}
                      className="w-full text-center mt-4 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Change Aadhaar Number
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
