import { Mail, Phone, MapPin, ChevronRight } from 'lucide-react';

export default function ContactPage() {
    return (
        <div className="w-full py-8 pb-24 px-4">
            <h1 className="text-3xl font-black text-foreground mb-4 tracking-tight">Get in Touch</h1>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Our team of riders is here to help you capture the perfect angle.
            </p>

            <div className="space-y-4 mb-12">
                <a href="mailto:support@leananglestudio.com" className="flex items-center gap-4 p-4 rounded-2xl bg-surface/50 border border-surface-border/50 active:scale-95 transition-transform">
                    <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                        <Mail className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email Us</p>
                        <p className="font-bold text-foreground text-sm">support@leananglestudio.com</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </a>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface/50 border border-surface-border/50">
                    <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                        <Phone className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Call Us</p>
                        <p className="font-bold text-foreground text-sm">1-800-LEAN-ANG</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface/50 border border-surface-border/50">
                    <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                        <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Location</p>
                        <p className="font-bold text-foreground text-sm">Austin, Texas (HQ)</p>
                    </div>
                </div>
            </div>

            <div className="bg-surface/50 border border-surface-border/50 p-6 rounded-3xl">
                <h2 className="text-xl font-black mb-6 tracking-tight">Message Us</h2>
                <form className="flex flex-col gap-4">
                    <input type="text" className="w-full bg-background/50 border border-surface-border/50 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent" placeholder="Name" />
                    <input type="email" className="w-full bg-background/50 border border-surface-border/50 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent" placeholder="Email" />
                    <textarea rows={4} className="w-full bg-background/50 border border-surface-border/50 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent" placeholder="How can we help?"></textarea>
                    <button type="button" className="bg-accent text-white font-bold py-4 rounded-xl active:scale-95 transition-transform shadow-lg shadow-accent/20 mt-2">
                        Send Message
                    </button>
                </form>
            </div>
        </div>
    );
}
