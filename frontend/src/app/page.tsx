import Link from 'next/link';
import { ChevronRight, Video, ShieldCheck, Zap, MousePointerClick, Clock, Repeat, CheckCircle, Wrench, Sparkles, CreditCard, Star, Quote } from 'lucide-react';
import FeaturedGearSection from '@/components/home/FeaturedGearSection';
import FeaturedBundlesSection from '@/components/home/FeaturedBundlesSection';

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-background">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center pt-20 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel mb-8 border-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping-large absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-xs font-medium text-foreground tracking-wide uppercase">New Gear Available</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 mb-6 max-w-4xl">
            Capture The Ride. <br className="hidden md:block" />
            <span className="text-accent">Don&apos;t Buy The Gear.</span>
          </h1>

          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Premium action cameras, mounts, and audio setups for moto vloggers. Rent for a weekend or a month. Delivered to your door.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href="/catalog"
              className="btn-liquid flex items-center justify-center gap-2 bg-accent text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-[0_0_40px_-10px_rgba(219,130,24,0.5)]"
            >
              <Video className="h-5 w-5 relative z-10" />
              <span className="relative z-10">Rent Gear Now</span>
            </Link>
            <Link
              href="/how-it-works"
              className="btn-liquid flex items-center justify-center gap-2 glass-panel !bg-transparent text-foreground px-8 py-4 rounded-full font-bold text-lg"
            >
              <span className="relative z-10">How It Works</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground relative z-10" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-surface/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 text-accent">
                <Video className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Premium Gear</h3>
              <p className="text-muted-foreground leading-relaxed">Top-tier GoPros, Insta360s, and professional audio setups guaranteed to work flawlessly.</p>
            </div>

            <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 text-accent">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Fast Setup</h3>
              <p className="text-muted-foreground leading-relaxed">Pre-configured mounts tailored for helmets, handlebars, and fairings. Ready to shoot in minutes.</p>
            </div>

            <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 text-accent">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Damage Protection</h3>
              <p className="text-muted-foreground leading-relaxed">Ride with peace of mind. Optional damage protection plans cover you against unexpected drops and spills.</p>
            </div>
          </div>
        </div>
      </section>
      {/* Featured Gear Section (Dynamic Client Component) */}
      <FeaturedGearSection />

      {/* How It Works Section */}
      <section className="py-24 bg-surface/10 relative z-10 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Your next moto vlog is just three simple steps away. No complex contracts, just ride.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop Only) */}
            <div className="hidden md:block absolute top-[48px] left-[15%] right-[15%] h-1 bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0 z-0"></div>

            <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center relative z-10">
              <div className="h-24 w-24 rounded-full bg-background border-4 border-accent flex items-center justify-center mb-8 shadow-lg shadow-accent/20">
                <MousePointerClick className="h-10 w-10 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">1. Choose Your Gear</h3>
              <p className="text-muted-foreground leading-relaxed">Browse our catalog of premium action cameras and audio setups perfectly tailored for moto vlogging.</p>
            </div>

            <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center relative z-10">
              <div className="h-24 w-24 rounded-full bg-background border-4 border-accent flex items-center justify-center mb-8 shadow-lg shadow-accent/20">
                <Clock className="h-10 w-10 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">2. We Deliver</h3>
              <p className="text-muted-foreground leading-relaxed">Select your dates. We deliver the sanitized, fully-charged gear straight to your doorstep before your ride.</p>
            </div>

            <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center relative z-10">
              <div className="h-24 w-24 rounded-full bg-background border-4 border-accent flex items-center justify-center mb-8 shadow-lg shadow-accent/20">
                <Repeat className="h-10 w-10 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">3. Ride &amp; Return</h3>
              <p className="text-muted-foreground leading-relaxed">Capture epic footage on your trip. When you&apos;re done, simply pack it up and we&apos;ll handle the return shipping.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Bundles Section - Dynamic Client Component */}
      <FeaturedBundlesSection />

      {/* Why Choose Us Section */}
      <section className="py-24 bg-surface/10 relative z-10 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">Why Rent Instead of Buy?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Action cameras depreciate fast and release new models every year. Stop buying gear that sits in a drawer between trips.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-10 rounded-3xl group">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Always Up To Date</h3>
              <p className="text-muted-foreground leading-relaxed">Why be stuck with the Hero 10 when the 12 is out? Renting guarantees you always shoot with the latest flagship tech and highest resolutions.</p>
            </div>

            <div className="glass-panel p-10 rounded-3xl group">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform">
                <Wrench className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Zero Maintenance</h3>
              <p className="text-muted-foreground leading-relaxed">No need to manage firmware updates, buy replacement batteries, or clean lenses. We handle all the tedious maintenance before delivery.</p>
            </div>

            <div className="glass-panel p-10 rounded-3xl group">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">No Depreciation</h3>
              <p className="text-muted-foreground leading-relaxed">A ₹45,000 camera setup loses half its value in a year. Rent it for a 3-day weekend trip for just ₹3,600 and never worry about resale value again.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Rider Reviews Section */}
      <section className="py-24 relative z-10 w-full overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-hover/5 rounded-full filter blur-[100px] pointer-events-none -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">Trusted by Riders</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Don&apos;t just take our word for it. See what fellow moto vloggers say about Lean Angle Studio.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="glass-panel p-8 rounded-3xl relative">
              <Quote className="absolute top-6 right-6 h-12 w-12 text-accent/10" />
              <div className="flex gap-1 mb-6 text-accent">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-foreground leading-relaxed italic mb-8 relative z-10">
                &quot;Rented the Insta360 X4 for a weekend trip to Spiti Valley. The gear was spotless, batteries were fully charged, and the invisible selfie stick mount they provided worked flawlessly on my handlebars.&quot;
              </p>
              <div className="flex items-center gap-4 border-t border-surface-border pt-6">
                <div className="h-10 w-10 rounded-full bg-surface-border flex items-center justify-center font-bold text-muted-foreground">R</div>
                <div>
                  <h4 className="font-bold text-foreground">Rahul Sharma</h4>
                  <p className="text-sm text-muted-foreground">KTM 390 Adventure</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="glass-panel p-8 rounded-3xl relative md:translate-y-8">
              <Quote className="absolute top-6 right-6 h-12 w-12 text-accent/10" />
              <div className="flex gap-1 mb-6 text-accent">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-foreground leading-relaxed italic mb-8 relative z-10">
                &quot;Saved me ₹40k! I was going to buy a GoPro just for one long ride, but renting from Lean Angle made so much more sense. The audio setup with the DJI mic was crystal clear even at 100kmph.&quot;
              </p>
              <div className="flex items-center gap-4 border-t border-surface-border pt-6">
                <div className="h-10 w-10 rounded-full bg-surface-border flex items-center justify-center font-bold text-muted-foreground">A</div>
                <div>
                  <h4 className="font-bold text-foreground">Aryan Patel</h4>
                  <p className="text-sm text-muted-foreground">Royal Enfield Himalayan</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="glass-panel p-8 rounded-3xl relative">
              <Quote className="absolute top-6 right-6 h-12 w-12 text-accent/10" />
              <div className="flex gap-1 mb-6 text-accent">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-foreground leading-relaxed italic mb-8 relative z-10">
                &quot;The delivery was super fast and everything came in a rugged hard case. The chin mount they included was way better than the cheap plastic ones I&apos;ve used before. Highly recommend!&quot;
              </p>
              <div className="flex items-center gap-4 border-t border-surface-border pt-6">
                <div className="h-10 w-10 rounded-full bg-surface-border flex items-center justify-center font-bold text-muted-foreground">S</div>
                <div>
                  <h4 className="font-bold text-foreground">Sneha Reddy</h4>
                  <p className="text-sm text-muted-foreground">Triumph Trident 660</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
