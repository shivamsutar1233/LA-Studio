import { CheckCircle2, Truck, CalendarCheck, Camera, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="w-full py-4 pb-24">
      <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground mb-8">
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-bold uppercase tracking-wider">Home</span>
      </Link>

      <div className="mb-12">
        <h1 className="text-3xl font-black text-foreground mb-2 tracking-tight">How it Works</h1>
        <p className="text-sm text-muted-foreground">Premium gear rental in 4 simple steps.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-surface border border-surface-border rounded-3xl p-6">
          <div className="h-12 w-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
            <CalendarCheck className="h-6 w-6 text-accent" />
          </div>
          <h2 className="text-xl font-black text-foreground mb-2">1. Choose Gear</h2>
          <p className="text-xs text-muted-foreground leading-relaxed uppercase tracking-wide font-bold mb-1 opacity-70">Pick Your Dates</p>
          <p className="text-sm text-muted-foreground leading-relaxed">Browse our catalog and select your ride dates. Book early to secure your kit.</p>
        </div>

        <div className="bg-surface border border-surface-border rounded-3xl p-6">
          <div className="h-12 w-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
            <Truck className="h-6 w-6 text-accent" />
          </div>
          <h2 className="text-xl font-black text-foreground mb-2">2. Free Delivery</h2>
          <p className="text-xs text-muted-foreground leading-relaxed uppercase tracking-wide font-bold mb-1 opacity-70">To Your Door</p>
          <p className="text-sm text-muted-foreground leading-relaxed">We deliver charged gear with SD cards ready to shoot. Anywhere in the US.</p>
        </div>

        <div className="bg-surface border border-surface-border rounded-3xl p-6">
          <div className="h-12 w-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
            <Camera className="h-6 w-6 text-accent" />
          </div>
          <h2 className="text-xl font-black text-foreground mb-2">3. Ride & Capture</h2>
          <p className="text-xs text-muted-foreground leading-relaxed uppercase tracking-wide font-bold mb-1 opacity-70">Create Memories</p>
          <p className="text-sm text-muted-foreground leading-relaxed">Hit the road. Our mounts keep your gear safe while you capture the thrill.</p>
        </div>

        <div className="bg-surface border border-surface-border rounded-3xl p-6">
          <div className="h-12 w-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle2 className="h-6 w-6 text-accent" />
          </div>
          <h2 className="text-xl font-black text-foreground mb-2">4. Easy Return</h2>
          <p className="text-xs text-muted-foreground leading-relaxed uppercase tracking-wide font-bold mb-1 opacity-70">Prepaid Shipping</p>
          <p className="text-sm text-muted-foreground leading-relaxed">Pack it up and use the included label. Drop it at any carrier location.</p>
        </div>
      </div>
    </div>
  );
}
