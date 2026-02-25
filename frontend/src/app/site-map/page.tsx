import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function SitemapPage() {
  const sitemapSections = [
    {
      title: 'Explore & Shop',
      links: [
        { label: 'Home', href: '/' },
        { label: 'All Gear Catalog', href: '/catalog' },
        { label: 'Cameras', href: '/catalog?category=camera' },
        { label: 'Audio Setup', href: '/catalog?category=audio' },
        { label: 'Mounts', href: '/catalog?category=mount' },
        { label: 'Shopping Cart', href: '/cart' },
      ],
    },
    {
      title: 'Account',
      links: [
        { label: 'Login', href: '/auth/login' },
        { label: 'Register', href: '/auth/register' },
        { label: 'User Dashboard', href: '/dashboard' },
      ],
    },
    {
      title: 'Support & Info',
      links: [
        { label: 'Contact Us', href: '/contact' },
        { label: 'FAQ', href: '/faq' },
        { label: 'How it Works', href: '/how-it-works' },
      ],
    },
    {
      title: 'Legal Policies',
      links: [
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Shipping & Delivery', href: '/shipping-delivery' },
        { label: 'Cancellation & Refund', href: '/cancellation-refund' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-4">
            Site Map
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Navigate through all pages and resources available on Lean Angle Studio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sitemapSections.map((section, index) => (
            <div 
              key={index} 
              className="bg-surface/50 border border-surface-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <h2 className="text-xl font-bold text-foreground mb-4 border-b border-surface-border pb-2">
                {section.title}
              </h2>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      href={link.href} 
                      className="group flex items-center text-muted-foreground hover:text-accent transition-colors duration-200"
                    >
                      <ChevronRight className="h-4 w-4 mr-2 text-surface-border group-hover:text-accent transition-colors duration-200" />
                      <span className="text-sm font-medium">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
