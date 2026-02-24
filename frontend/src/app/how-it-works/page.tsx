import { CheckCircle2, Truck, CalendarCheck, Camera } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 w-full">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-foreground mb-4">How Lean Angle Studio Works</h1>
        <p className="text-lg text-muted-foreground">Renting premium moto vlogging gear has never been easier.</p>
      </div>

      <div className="space-y-12">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="h-20 w-20 shrink-0 bg-accent/20 text-accent rounded-full flex items-center justify-center">
            <CalendarCheck className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">1. Choose Your Gear & Dates</h2>
            <p className="text-muted-foreground leading-relaxed">Browse our catalog of premium GoPros, Insta360s, and microphone setups. Select the dates you need them for your ride. We recommend booking at least a week in advance.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-center md:flex-row-reverse">
          <div className="h-20 w-20 shrink-0 bg-accent/20 text-accent rounded-full flex items-center justify-center">
            <Truck className="h-10 w-10" />
          </div>
          <div className="md:text-right">
            <h2 className="text-2xl font-bold text-foreground mb-2">2. Free Delivery</h2>
            <p className="text-muted-foreground leading-relaxed">We deliver the gear directly to your door anywhere in the US. All gear arrives fully charged, with formatted SD cards, ready to shoot out of the box.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="h-20 w-20 shrink-0 bg-accent/20 text-accent rounded-full flex items-center justify-center">
            <Camera className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">3. Ride & Capture</h2>
            <p className="text-muted-foreground leading-relaxed">Hit the road and create amazing content. Our tailored helmet and motorcycle mounts ensure your gear stays secure at all speeds.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-center md:flex-row-reverse">
          <div className="h-20 w-20 shrink-0 bg-accent/20 text-accent rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="md:text-right">
            <h2 className="text-2xl font-bold text-foreground mb-2">4. Easy Return</h2>
            <p className="text-muted-foreground leading-relaxed">When your rental period is over, pack the gear back into the original box and use the included prepaid shipping label to drop it off at any carrier location.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
