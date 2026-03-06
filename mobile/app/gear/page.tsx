"use client";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import api from '@/lib/api';
import { ShieldCheck, CheckCircle2, Star, ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { differenceInDays, parseISO, addDays, format } from 'date-fns';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface GearDetail {
    id: string;
    name: string;
    category: string;
    pricePerDay: number;
    thumbnail?: string;
    images?: string;
    description?: string;
    features?: string[];
    includes?: string[];
}

function GearDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'gear';
    const isBundle = type === 'bundle';

    const [gear, setGear] = useState<GearDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [days, setDays] = useState(0);
    const [bookedDates, setBookedDates] = useState<{ startDate: string, endDate: string }[]>([]);
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(true);

    const addToCart = useCartStore((state) => state.addToCart);

    useEffect(() => {
        if (!id) return;
        const fetchGearData = async () => {
            setIsCheckingAvailability(true);
            try {
                const endpoint = isBundle ? `/api/bundles/${id}` : `/api/gears/${id}`;
                const [gearRes, bookedRes] = await Promise.all([
                    api.get(endpoint),
                    api.get(`${endpoint}/booked-dates`)
                ]);

                setGear(gearRes.data);
                if (gearRes.data.thumbnail) {
                    setSelectedImage(gearRes.data.thumbnail);
                }

                setBookedDates(bookedRes.data || []);
            } catch (error) {
                console.error("Error fetching gear details:", error);
            } finally {
                setLoading(false);
                setIsCheckingAvailability(false);
            }
        };
        fetchGearData();
    }, [id, isBundle]);

    useEffect(() => {
        if (startDate && endDate) {
            const diff = differenceInDays(endDate, startDate);
            setDays(diff > 0 ? diff : 0);
        } else {
            setDays(0);
        }
    }, [startDate, endDate]);

    const hasOverlapWithBookedDates = () => {
        if (!startDate || !endDate) return false;

        return bookedDates.some(booking => {
            const bStart = new Date(booking.startDate);
            bStart.setHours(0, 0, 0, 0);
            const bEnd = new Date(booking.endDate);
            bEnd.setHours(0, 0, 0, 0);

            const sDate = new Date(startDate);
            sDate.setHours(0, 0, 0, 0);
            const eDate = new Date(endDate);
            eDate.setHours(0, 0, 0, 0);

            return (
                (sDate <= bEnd && eDate >= bStart) ||
                (bStart >= sDate && bStart <= eDate)
            );
        });
    };

    const disabledDateRanges = bookedDates.map(b => ({
        start: new Date(b.startDate),
        end: new Date(b.endDate)
    }));

    const isUnavailable = hasOverlapWithBookedDates();

    const handleAddToCart = () => {
        if (!gear) return;
        if (days <= 0) {
            toast.error("Invalid Dates", { description: "Please select valid rental dates (at least 1 day)." });
            return;
        }
        if (isUnavailable) {
            toast.error("Gear Unavailable", { description: "This gear is already booked for the selected dates." });
            return;
        }

        const safeStart = startDate ? format(startDate, 'yyyy-MM-dd') : '';
        const safeEnd = endDate ? format(endDate, 'yyyy-MM-dd') : '';

        addToCart({
            gearId: gear.id,
            itemType: isBundle ? 'bundle' : 'gear',
            name: gear.name,
            category: isBundle ? 'Curated Bundle' : gear.category,
            pricePerDay: gear.pricePerDay,
            startDate: safeStart,
            endDate: safeEnd,
            days,
            thumbnail: selectedImage || gear.thumbnail
        });

        toast.success("Added to Cart", { description: `${gear.name} has been added to your rental cart.` });
        router.push('/cart');
    };

    if (loading) {
        return <div className="max-w-7xl mx-auto px-4 py-24 flex justify-center items-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!gear) {
        return <div className="max-w-7xl mx-auto px-4 py-24 text-center text-muted-foreground">Gear not found.</div>;
    }

    const description = gear.description || 'Professional grade equipment verified and tested for moto vlogging.';
    const features = gear.features || ['Premium Quality', 'Tested for Moto Vlogging', 'Sanitized before rental', 'Fully Charged'];

    return (
        <div className="w-full py-4 pb-24">
            <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </button>

            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                    <div className="aspect-square w-full rounded-3xl bg-surface/50 dark:bg-surface/20 border border-surface-border/50 backdrop-blur-2xl backdrop-saturate-[1.8] shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] flex items-center justify-center relative overflow-hidden group">
                        {selectedImage ? (
                            <img src={selectedImage} alt={gear.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                        ) : (
                            <div className="text-muted-foreground font-mono text-xl group-hover:scale-105 transition-transform duration-700 ease-out text-center px-4">
                                IMAGE: <br />{gear.name}
                            </div>
                        )}
                        {gear.category && gear.category === 'Camera' && !isBundle && (
                            <div className="absolute top-4 right-4 bg-background/60 dark:bg-surface-foreground/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-sm font-bold text-foreground dark:text-background border border-surface-border/50 shadow-sm">
                                Premium Quality
                            </div>
                        )}
                        {isBundle && (
                            <div className="absolute top-4 right-4 bg-accent/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-sm font-bold text-white shadow-sm border border-accent">
                                Curated Kit
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {gear.thumbnail && (
                            <div
                                onClick={() => setSelectedImage(gear.thumbnail!)}
                                className={`aspect-square rounded-2xl bg-surface/40 backdrop-blur-md border flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${selectedImage === gear.thumbnail ? 'border-accent ring-2 ring-accent/50 opacity-100 shadow-[0_0_15px_rgba(219,130,24,0.3)]' : 'border-surface-border/50 opacity-70 hover:opacity-100 hover:border-accent/50'}`}
                            >
                                <img src={gear.thumbnail} alt="Main Thumbnail" className="h-full w-full object-cover" />
                            </div>
                        )}

                        {gear.images && gear.images !== '[]' && (
                            JSON.parse(gear.images).map((imgUrl: string, idx: number) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedImage(imgUrl)}
                                    className={`aspect-square rounded-2xl bg-surface/40 backdrop-blur-md border flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${selectedImage === imgUrl ? 'border-accent ring-2 ring-accent/50 opacity-100 shadow-[0_0_15px_rgba(219,130,24,0.3)]' : 'border-surface-border/50 opacity-70 hover:opacity-100 hover:border-accent/50'}`}
                                >
                                    <img src={imgUrl} alt={`Gallery ${idx}`} className="h-full w-full object-cover" />
                                </div>
                            ))
                        )}

                        {!gear.thumbnail && (!gear.images || gear.images === '[]') && (
                            [1, 2, 3].map(i => (
                                <div key={i} className="aspect-square rounded-xl bg-surface border border-surface-border flex items-center justify-center text-xs text-muted-foreground font-mono hover:border-accent cursor-pointer transition-colors">
                                    THUMB {i}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 rounded-full">
                            {isBundle ? 'Included Items' : gear.category}
                        </span>
                        <div className="flex items-center text-yellow-500 text-sm font-bold gap-1">
                            <Star className="h-4 w-4 fill-current" /> 4.9 (128 reviews)
                        </div>
                    </div>

                    <h1 className="text-3xl font-extrabold text-foreground mb-3 tracking-tight">
                        {gear.name}
                    </h1>

                    <div className="flex items-end gap-2 mb-6">
                        <span className="text-4xl font-black text-foreground">₹{gear.pricePerDay}</span>
                        <span className="text-muted-foreground mb-1 text-sm font-medium">/ day</span>
                    </div>

                    <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                        {description}
                    </p>

                    <div className="bg-background/60 dark:bg-surface/40 backdrop-blur-2xl backdrop-saturate-[1.8] border border-surface-border/50 p-6 rounded-3xl mb-8 shadow-lg transition-all duration-500 hover:border-accent/30 hover:shadow-xl">
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-accent" /> Guaranteed Condition
                        </h3>
                        <p className="text-sm text-muted-foreground">All equipment is tested, sanitized, and fully charged before every rental. Memory cards are formatted and ready to shoot.</p>
                    </div>

                    <div className="space-y-6 mb-10">
                        <div>
                            <h3 className="text-xl font-bold text-foreground mb-4">Key Features</h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                                {features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                        <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-auto border-t border-surface-border pt-8">
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

                        <div className="grid grid-cols-2 gap-4 mb-6 relative z-10 w-full">
                            <div className="flex flex-col w-full">
                                <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
                                <div className="relative w-full">
                                    <DatePicker
                                        selected={startDate}
                                        onChange={(date: Date | null) => {
                                            setStartDate(date);
                                            if (endDate && date && date > endDate) {
                                                setEndDate(null);
                                            }
                                        }}
                                        selectsStart
                                        startDate={startDate || undefined}
                                        endDate={endDate || undefined}
                                        minDate={new Date()}
                                        excludeDateIntervals={disabledDateRanges}
                                        placeholderText="Add Date"
                                        className="w-full px-4 py-3.5 rounded-2xl border border-surface-border/50 bg-background/50 dark:bg-surface/50 backdrop-blur-xl text-foreground font-medium focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-300 shadow-inner text-center placeholder:text-muted-foreground/50 hover:bg-surface/80"
                                        calendarClassName="custom-datepicker"
                                        wrapperClassName="w-full"
                                        dateFormat="MMM dd, yyyy"
                                        portalId="root-portal"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col w-full">
                                <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
                                <div className="relative w-full">
                                    <DatePicker
                                        selected={endDate}
                                        onChange={(date: Date | null) => setEndDate(date)}
                                        selectsEnd
                                        startDate={startDate || undefined}
                                        endDate={endDate || undefined}
                                        minDate={startDate || new Date()}
                                        excludeDateIntervals={disabledDateRanges}
                                        placeholderText="Add Date"
                                        className="w-full px-4 py-3.5 rounded-2xl border border-surface-border/50 bg-background/50 dark:bg-surface/50 backdrop-blur-xl text-foreground font-medium focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-300 shadow-inner text-center placeholder:text-muted-foreground/50 hover:bg-surface/80"
                                        calendarClassName="custom-datepicker"
                                        wrapperClassName="w-full"
                                        dateFormat="MMM dd, yyyy"
                                        portalId="root-portal"
                                    />
                                </div>
                            </div>
                        </div>

                        {isCheckingAvailability ? (
                            <div className="flex justify-center items-center py-4 mb-2 text-muted-foreground text-sm gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" /> Checking availability...
                            </div>
                        ) : isUnavailable ? (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl mb-6 text-sm font-medium text-center">
                                Already booked for these dates.
                            </div>
                        ) : days > 0 ? (
                            <div className="flex justify-between items-center mb-6 px-4 py-3 bg-accent/10 rounded-xl text-accent font-medium">
                                <span>{days} Day Rental</span>
                                <span>Total: ₹{(gear.pricePerDay * days).toFixed(2)}</span>
                            </div>
                        ) : null}

                        <button
                            onClick={handleAddToCart}
                            disabled={isUnavailable || isCheckingAvailability}
                            className={`group/mainbtn relative overflow-hidden w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 active:scale-[0.98] shadow-lg ${days > 0 && !isUnavailable ? 'bg-accent text-white shadow-[0_8px_20px_-6px_rgba(219,130,24,0.6)] hover:shadow-[0_12px_25px_-6px_rgba(219,130,24,0.8)] hover:-translate-y-1 border border-accent/20' : 'bg-surface-border/50 text-muted-foreground cursor-not-allowed backdrop-blur-sm'
                                }`}
                        >
                            {days > 0 && !isUnavailable && (
                                <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover/mainbtn:translate-y-0 transition-transform duration-500 ease-in-out z-0"></div>
                            )}
                            <ShoppingCart className="h-5 w-5 relative z-10" />
                            <span className="relative z-10">{isUnavailable ? 'Unavailable' : days > 0 ? 'Add to Cart' : 'Select Dates'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function GearDetailPage() {
    return (
        <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-24 flex justify-center items-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <GearDetailContent />
        </Suspense>
    );
}
