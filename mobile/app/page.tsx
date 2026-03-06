import Link from 'next/link';
import { ChevronRight, Video, ShieldCheck, Zap, MousePointerClick, Clock, Repeat, Sparkles, Wrench, CreditCard } from 'lucide-react';
import FeaturedGearSection from '@/components/home/FeaturedGearSection';
import FeaturedBundlesSection from '@/components/home/FeaturedBundlesSection';

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full py-12 flex flex-col items-center justify-center overflow-hidden bg-background">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5"></div>
        </div>

        <div className="relative z-10 w-full flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel mb-6 border-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping-large absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-[10px] font-bold text-foreground tracking-widest uppercase">New Gear Available</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 mb-4 leading-tight">
            Capture The Ride. <br />
            <span className="text-accent underline decoration-accent/30 underline-offset-4">Don&apos;t Buy The Gear.</span>
          </h1>

          <p className="text-base text-muted-foreground max-w-xs mb-8 leading-relaxed">
            Premium action cameras, mounts, and audio setups for moto vloggers. Rent for a weekend or a month.
          </p>

          <div className="flex flex-col gap-3 w-full max-w-sm">
            <Link
              href="/catalog"
              className="btn-liquid flex items-center justify-center gap-2 bg-accent text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
            >
              <Video className="h-5 w-5" />
              <span>Rent Gear Now</span>
            </Link>
            <Link
              href="/how-it-works"
              className="btn-liquid flex items-center justify-center gap-2 glass-panel !bg-transparent text-foreground py-4 rounded-xl font-bold text-lg active:scale-95 transition-transform"
            >
              <span>How It Works</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Gear Section */}
      <div className="mt-8">
        <FeaturedGearSection />
      </div>

      {/* Quick Features */}
      <section className="py-12 px-0">
        <div className="grid grid-cols-1 gap-4">
          <div className="glass-panel p-6 rounded-2xl flex items-start gap-4 text-left">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1 text-left">Damage Protection</h3>
              <p className="text-sm text-muted-foreground leading-snug text-left">Ride with peace of mind. We cover you against unexpected drops.</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex items-start gap-4 text-left">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1 text-left">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground leading-snug text-left">Charged gear delivered to your doorstep before your ride.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Bundles Section */}
      <FeaturedBundlesSection />

      {/* Simplified Steps */}
      <section className="py-12 bg-surface/10 rounded-3xl mb-8">
        <div className="px-6">
          <h2 className="text-2xl font-extrabold text-foreground mb-8 text-center">3 Steps to Vlogging</h2>
          <div className="space-y-8">
            <div className="flex items-center gap-6 text-left">
              <div className="h-14 w-14 shrink-0 rounded-full bg-background border-2 border-accent flex items-center justify-center shadow-md">
                <MousePointerClick className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-left">1. Choose Gear</h4>
                <p className="text-sm text-muted-foreground text-left">Browse our moto-specific catalog.</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-left">
              <div className="h-14 w-14 shrink-0 rounded-full bg-background border-2 border-accent flex items-center justify-center shadow-md">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-left">2. Get Delivered</h4>
                <p className="text-sm text-muted-foreground text-left">Charged & ready at your door.</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-left">
              <div className="h-14 w-14 shrink-0 rounded-full bg-background border-2 border-accent flex items-center justify-center shadow-md">
                <Repeat className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-left">3. Ride & Return</h4>
                <p className="text-sm text-muted-foreground text-left">Capture footage & return easily.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Renting Section */}
      <section className="py-12 px-0 space-y-6">
        <h2 className="text-2xl font-extrabold text-foreground text-center">Why Rent?</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="glass-panel p-6 rounded-2xl text-left">
            <Sparkles className="h-6 w-6 text-accent mb-3" />
            <h3 className="font-bold mb-1 text-left">Always Latest Tech</h3>
            <p className="text-sm text-muted-foreground leading-snug text-left">Shoot with the newest flagships every trip.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl text-left">
            <Wrench className="h-6 w-6 text-accent mb-3" />
            <h3 className="font-bold mb-1 text-left">Zero Maintenance</h3>
            <p className="text-sm text-muted-foreground leading-snug text-left">No charging, no cleaning, no updating.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl text-left">
            <CreditCard className="h-6 w-6 text-accent mb-3" />
            <h3 className="font-bold mb-1 text-left">Budget Friendly</h3>
            <p className="text-sm text-muted-foreground leading-snug text-left">Save thousands on gear depreciation.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

