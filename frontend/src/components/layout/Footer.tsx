import Link from 'next/link';
import { Instagram, Youtube, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-surface-border bg-surface/50 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center justify-center mb-6 bg-white/90 dark:bg-white/90 p-1.5 rounded-2xl inline-flex w-fit transition-all hover:scale-105 shadow-md">
              <img src="https://ab2bbkrtuubturud.public.blob.vercel-storage.com/product_images/1771907071468-n7j05b1-Lean%20Angle%20Logo%20V2%20.png" alt="Lean Angle Studio Logo" className="h-10 w-10 object-contain" />
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Turn Miles into Memories. Capture every ride with the best equipment without breaking the bank.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors"><Youtube className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors"><Twitter className="h-5 w-5" /></a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Explore</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/catalog" className="text-sm text-muted-foreground hover:text-accent transition-colors">All Gear</Link></li>
              <li><Link href="/catalog?category=camera" className="text-sm text-muted-foreground hover:text-accent transition-colors">Cameras</Link></li>
              <li><Link href="/catalog?category=audio" className="text-sm text-muted-foreground hover:text-accent transition-colors">Audio Setup</Link></li>
              <li><Link href="/catalog?category=mount" className="text-sm text-muted-foreground hover:text-accent transition-colors">Mounts</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Support</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/faq" className="text-sm text-muted-foreground hover:text-accent transition-colors">FAQ</Link></li>
              <li><Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-accent transition-colors">How it Works</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-accent transition-colors">Contact Us</Link></li>
              <li><Link href="/site-map" className="text-sm text-muted-foreground hover:text-accent transition-colors">Sitemap</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Legal</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-accent transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link href="/shipping-delivery" className="text-sm text-muted-foreground hover:text-accent transition-colors">Shipping & Delivery</Link></li>
              <li><Link href="/cancellation-refund" className="text-sm text-muted-foreground hover:text-accent transition-colors">Cancellation & Refund</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 border-t border-surface-border pt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Lean Angle Studio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
