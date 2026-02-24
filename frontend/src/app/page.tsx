import Link from 'next/link';
import { ChevronRight, Video, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-background">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent-hover rounded-full mix-blend-multiply filter blur-[128px] opacity-10"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center pt-20 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-3xl shadow-xl shadow-black/20">
            <span className="flex h-2 w-2 rounded-full bg-accent"></span>
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">New Gear Available</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 mb-6 max-w-4xl">
            Capture The Ride. <br className="hidden md:block"/>
            <span className="text-accent">Don't Buy The Gear.</span>
          </h1>
          
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Premium action cameras, mounts, and audio setups for moto vloggers. Rent for a weekend or a month. Delivered to your door.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/catalog" 
              className="flex items-center justify-center gap-2 bg-accent text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-accent-hover transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(225,29,72,0.5)]"
            >
              <Video className="h-5 w-5" />
              Rent Gear Now
            </Link>
            <Link 
              href="/how-it-works" 
              className="flex items-center justify-center gap-2 bg-white/5 backdrop-blur-3xl border border-white/10 text-foreground px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/20"
            >
              How It Works
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-surface/10 backdrop-blur-3xl border-y border-white/5 relative z-10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center mb-6 text-accent shadow-xl shadow-black/30">
                <Video className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Premium Gear</h3>
              <p className="text-muted-foreground leading-relaxed">Top-tier GoPros, Insta360s, and professional audio setups guaranteed to work flawlessly.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center mb-6 text-accent shadow-xl shadow-black/30">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Fast Setup</h3>
              <p className="text-muted-foreground leading-relaxed">Pre-configured mounts tailored for helmets, handlebars, and fairings. Ready to shoot in minutes.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center mb-6 text-accent shadow-xl shadow-black/30">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Damage Protection</h3>
              <p className="text-muted-foreground leading-relaxed">Ride with peace of mind. Optional damage protection plans cover you against unexpected drops and spills.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
