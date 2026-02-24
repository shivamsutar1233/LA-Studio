import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex flex-col md:flex-row gap-12 flex-grow">
      {/* Contact Info */}
      <div className="flex-1">
        <h1 className="text-4xl font-extrabold text-foreground mb-6">Get in Touch</h1>
        <p className="text-lg text-muted-foreground mb-8 line-clamp-2 lg:line-clamp-none">
          Have questions about our gear, mounting setups, or a current rental? Our team of riders is here to help you capture the perfect angle.
        </p>

        <div className="space-y-6">
          <div className="flex items-center gap-4 text-foreground">
            <div className="h-12 w-12 bg-surface border border-surface-border rounded-full flex items-center justify-center text-accent">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold">Email Us</p>
              <a href="mailto:support@leananglestudio.com" className="text-muted-foreground hover:text-accent">support@leananglestudio.com</a>
            </div>
          </div>
          <div className="flex items-center gap-4 text-foreground">
            <div className="h-12 w-12 bg-surface border border-surface-border rounded-full flex items-center justify-center text-accent">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold">Call Us</p>
              <span className="text-muted-foreground">1-800-LEAN-ANG</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-foreground">
            <div className="h-12 w-12 bg-surface border border-surface-border rounded-full flex items-center justify-center text-accent">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold">HQ location (No public showroom)</p>
              <span className="text-muted-foreground">Austin, Texas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="flex-1 bg-surface border border-surface-border p-8 rounded-2xl shadow-xl shadow-black/5">
        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Name</label>
            <input type="text" className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input type="email" className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent" placeholder="your@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Message</label>
            <textarea rows={4} className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent" placeholder="How can we help?"></textarea>
          </div>
          <button type="button" className="bg-accent text-white font-bold py-4 rounded-lg hover:bg-accent-hover transition-colors mt-2">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
