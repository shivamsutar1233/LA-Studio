"use client";

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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

export default function GearDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

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
        const [gearRes, bookedRes] = await Promise.all([
          api.get(`/api/gears/${id}`),
          api.get(`/api/gears/${id}/booked-dates`)
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
  }, [id]);

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

    // Check if the selected date range overlaps with any booked dates
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
        (sDate <= bEnd && eDate >= bStart) || // Standard overlap
        (bStart >= sDate && bStart <= eDate)   // Booked starts within selected
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

    // Format Date safely without timezone conversion issues
    const safeStart = startDate ? format(startDate, 'yyyy-MM-dd') : '';
    const safeEnd = endDate ? format(endDate, 'yyyy-MM-dd') : '';

    addToCart({
      gearId: gear.id,
      name: gear.name,
      category: gear.category,
      pricePerDay: gear.pricePerDay,
      startDate: safeStart,
      endDate: safeEnd,
      days
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

  // Fallback data for properties not fully modelled in MVP backend yet
  const description = gear.description || 'Professional grade equipment verified and tested for moto vlogging.';
  const features = gear.features || ['Premium Quality', 'Tested for Moto Vlogging', 'Sanitized before rental', 'Fully Charged'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <Link href="/catalog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" />
        Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Images Column */}
        <div className="flex flex-col gap-4">
          <div className="aspect-square w-full rounded-2xl bg-surface border border-surface-border flex items-center justify-center relative overflow-hidden group">
            {selectedImage ? (
              <img src={selectedImage} alt={gear.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <div className="text-muted-foreground font-mono text-xl group-hover:scale-110 transition-transform duration-500 text-center px-4">
                IMAGE: <br />{gear.name}
              </div>
            )}
            {gear.category === 'Camera' && (
              <div className="absolute top-4 right-4 bg-surface-foreground/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-bold text-background border border-surface-border">
                Premium Quality
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {/* Always show the thumbnail as the first option if it exists */}
            {gear.thumbnail && (
              <div
                onClick={() => setSelectedImage(gear.thumbnail!)}
                className={`aspect-square rounded-xl bg-surface border flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-accent ${selectedImage === gear.thumbnail ? 'border-accent ring-2 ring-accent/50 opacity-100' : 'border-surface-border opacity-70 hover:opacity-100'}`}
              >
                <img src={gear.thumbnail} alt="Main Thumbnail" className="h-full w-full object-cover" />
              </div>
            )}

            {/* Show remaining gallery images */}
            {gear.images && gear.images !== '[]' && (
              JSON.parse(gear.images).map((imgUrl: string, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`aspect-square rounded-xl bg-surface border flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-accent ${selectedImage === imgUrl ? 'border-accent ring-2 ring-accent/50 opacity-100' : 'border-surface-border opacity-70 hover:opacity-100'}`}
                >
                  <img src={imgUrl} alt={`Gallery ${idx}`} className="h-full w-full object-cover" />
                </div>
              ))
            )}

            {/* Show placeholders if absolutely no images exist */}
            {!gear.thumbnail && (!gear.images || gear.images === '[]') && (
              [1, 2, 3].map(i => (
                <div key={i} className="aspect-square rounded-xl bg-surface border border-surface-border flex items-center justify-center text-xs text-muted-foreground font-mono hover:border-accent cursor-pointer transition-colors">
                  THUMB {i}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Details Column */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 rounded-full">
              {gear.category}
            </span>
            <div className="flex items-center text-yellow-500 text-sm font-bold gap-1">
              <Star className="h-4 w-4 fill-current" /> 4.9 (128 reviews)
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
            {gear.name}
          </h1>

          <div className="flex items-end gap-2 mb-8">
            <span className="text-5xl font-black text-foreground">₹{gear.pricePerDay}</span>
            <span className="text-muted-foreground mb-2 font-medium">/ day</span>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            {description}
          </p>

          <div className="bg-surface border border-surface-border p-6 rounded-2xl mb-8">
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

          {/* Action Area: Date Picker & Add to Cart */}
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
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-surface-border bg-surface text-foreground font-medium focus:ring-0 focus:border-accent transition-colors shadow-sm text-center placeholder:text-muted-foreground/70"
                    calendarClassName="custom-datepicker"
                    wrapperClassName="w-full"
                    dateFormat="MMM dd, yyyy"
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
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-surface-border bg-surface text-foreground font-medium focus:ring-0 focus:border-accent transition-colors shadow-sm text-center placeholder:text-muted-foreground/70"
                    calendarClassName="custom-datepicker"
                    wrapperClassName="w-full"
                    dateFormat="MMM dd, yyyy"
                  />
                </div>
              </div>
            </div>

            {isCheckingAvailability ? (
              <div className="flex justify-center items-center py-4 mb-2 text-muted-foreground text-sm gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking availability...
              </div>
            ) : isUnavailable ? (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
                This gear is already booked for these dates. Please select different dates.
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
              className={`w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.98] shadow-lg ${days > 0 && !isUnavailable ? 'bg-accent text-white hover:bg-accent-hover shadow-accent/20' : 'bg-surface-border text-muted-foreground cursor-not-allowed'
                }`}
            >
              <ShoppingCart className="h-5 w-5" />
              {isUnavailable ? 'Unavailable for Dates' : days > 0 ? 'Add to Rental Cart' : 'Select Dates to Rent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
