"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

function UndertakingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get('id');

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

    useEffect(() => {
        if (!user) {
            router.push('/auth/login');
            return;
        }

        if (!bookingId) {
            router.push('/dashboard');
            return;
        }

        const fetchData = async () => {
            try {
                const bookingsRes = await api.get('/api/bookings', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const foundBooking = bookingsRes.data.find((b: BookingData) => b.id === bookingId);
                if (!foundBooking) {
                    toast.error("Booking not found");
                    router.push('/dashboard');
                    return;
                }

                if (foundBooking.undertakingSigned === 1) {
                    toast.info("Undertaking already signed.");
                    router.push('/dashboard');
                    return;
                }

                setBooking(foundBooking);

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
    }, [user, token, router, bookingId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        if (files[0].size > 5 * 1024 * 1024) {
            toast.error("File too large (max 5MB)");
            return;
        }
        setAadhaarFile(files[0]);
    };

    const handleGenerateOTP = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const strippedAadhaar = aadhaarNumber.replace(/\s+/g, '');
        if (!/^\d{12}$/.test(strippedAadhaar)) {
            toast.error("12-digit Aadhaar required");
            return;
        }
        if (!aadhaarFile) {
            toast.error("Upload Aadhaar image/PDF");
            return;
        }

        setIsSubmitting(true);
        try {
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

            const res = await api.post(`/api/bookings/${bookingId}/aadhaar/generate-otp`, {
                aadhaarNumber: strippedAadhaar
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setClientId(res.data.clientId);
            setOtpSent(true);
            toast.success("OTP Sent");
        } catch (error: unknown) {
            setIsUploading(false);
            const message = error instanceof Error ? (error as any).response?.data?.message : "OTP generation failed";
            toast.error(message || "OTP generation failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpCode || otpCode.length < 4) {
            toast.error("Invalid OTP");
            return;
        }

        setIsSubmitting(true);
        try {
            const strippedAadhaar = aadhaarNumber.replace(/\s+/g, '');
            await api.post(`/api/bookings/${bookingId}/aadhaar/submit-otp`, {
                clientId,
                otp: otpCode,
                aadhaarNumber: strippedAadhaar,
                aadhaarUrl: uploadedFileUrl
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Signed Successfully", { icon: <CheckCircle className="text-green-500 h-5 w-5" /> });
            router.push('/dashboard');
        } catch (error: unknown) {
            const message = error instanceof Error ? (error as any).response?.data?.message : "Verification failed";
            toast.error(message || "Verification failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !booking) {
        return <div className="flex-1 flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    const formatAadhaarInput = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const parts = [];
        for (let i = 0, len = v.length; i < len; i += 4) {
            parts.push(v.substring(i, i + 4));
        }
        return parts.join(' ');
    };

    return (
        <div className="w-full py-4 pb-24">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-6">
                <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <div className="mb-8">
                <div className="inline-flex items-center justify-center p-2 bg-accent/10 rounded-xl mb-3">
                    <FileSignature className="h-6 w-6 text-accent" />
                </div>
                <h1 className="text-2xl font-black text-foreground mb-1">Undertaking</h1>
                <p className="text-xs text-muted-foreground">Verification required for gear release.</p>
            </div>

            <div className="space-y-6">
                <div className="bg-surface border border-surface-border rounded-3xl p-6">
                    <h3 className="font-bold text-foreground mb-3 flex items-center gap-2 border-b border-surface-border pb-3">
                        <Package className="h-4 w-4 text-accent" /> Rental Specs
                    </h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Start</p>
                                <p className="text-xs font-bold text-foreground">{booking.startDate}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">End</p>
                                <p className="text-xs font-bold text-foreground">{booking.endDate}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-surface/50 border border-surface-border rounded-3xl p-6">
                    {!otpSent ? (
                        <form onSubmit={handleGenerateOTP} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Aadhaar Number</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={14}
                                    placeholder="XXXX XXXX XXXX"
                                    value={aadhaarNumber}
                                    onChange={(e) => setAadhaarNumber(formatAadhaarInput(e.target.value))}
                                    className="w-full rounded-2xl border border-surface-border bg-background px-4 py-4 text-xl font-mono tracking-widest text-foreground outline-none focus:border-accent"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Upload ID Copy</label>
                                <label className={`cursor-pointer flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed ${aadhaarFile ? 'border-accent bg-accent/5' : 'border-surface-border bg-background'} px-4 py-8 transition-all`}>
                                    <input type="file" accept="image/*,application/pdf" required onChange={handleFileUpload} className="hidden" />
                                    {aadhaarFile ? (
                                        <div className="flex flex-col items-center text-center">
                                            <CheckCircle className="h-8 w-8 text-accent mb-2" />
                                            <span className="text-xs font-bold text-foreground truncate max-w-[200px]">{aadhaarFile.name}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-center">
                                            <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                                            <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">Tap to upload</p>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || aadhaarNumber.replace(/\s+/g, '').length !== 12 || !aadhaarFile}
                                className="w-full bg-accent text-white font-black py-4 rounded-2xl shadow-lg shadow-accent/20 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span className="text-sm uppercase tracking-widest">{isUploading ? 'Uploading...' : 'Connecting...'}</span>
                                    </div>
                                ) : <span className="uppercase tracking-widest">Send OTP</span>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                                <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">OTP Sent to Mobile</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 text-center">Enter 6-digit Code</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    placeholder="123456"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full rounded-2xl border border-surface-border bg-background px-4 py-4 text-3xl text-center font-mono tracking-[0.4em] text-foreground outline-none focus:border-accent"
                                />
                            </div>

                            <div className="space-y-6">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-surface-border text-accent focus:ring-accent" />
                                    <span className="text-[10px] font-medium text-muted-foreground leading-relaxed uppercase tracking-wide">
                                        I accept full liability for the gear and confirm the details provided are accurate for e-KYC signature.
                                    </span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || otpCode.length < 4}
                                    className="w-full bg-accent text-white font-black py-4 rounded-2xl shadow-lg shadow-accent/20 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : <span className="uppercase tracking-widest">Verify & Sign</span>}
                                </button>
                                <button type="button" onClick={() => setOtpSent(false)} className="w-full text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">Back to Aadhaar</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function UndertakingPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <UndertakingContent />
        </Suspense>
    );
}
