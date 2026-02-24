"use client";

import Link from 'next/link';
import { Menu, X, ShoppingCart, Sun, Moon, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const cartItemsCount = useCartStore((state) => state.items.length);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/40 backdrop-blur-3xl shadow-sm transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="flex items-center justify-center bg-white/90 dark:bg-white/90 p-1.5 rounded-2xl transition-all hover:scale-105 shadow-md">
            <img src="https://ab2bbkrtuubturud.public.blob.vercel-storage.com/product_images/1771907071468-n7j05b1-Lean%20Angle%20Logo%20V2%20.png" alt="Lean Angle Studio Logo" className="h-10 w-10 object-contain" />
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex md:items-center md:gap-8">
          <Link href="/catalog" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
            Gear Catalog
          </Link>
          <Link href="/how-it-works" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
            How It Works
          </Link>
          <Link href="/faq" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
            FAQ
          </Link>
          <Link href="/cart">
            <button className="relative flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-surface-border">
              <ShoppingCart className="h-4 w-4" />
              <span>Cart</span>
              {mounted && cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </Link>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full bg-surface text-foreground hover:bg-surface-border transition-colors"
            aria-label="Toggle theme"
          >
            {mounted && theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          {mounted && user ? (
            <div className="flex items-center gap-2 border-l border-surface-border pl-4 ml-2">
              <Link href={user.role === 'admin' ? '/dashboard/admin' : '/dashboard/user'}>
                <button className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent transition-colors">
                  <User className="h-4 w-4" />
                  {user.name.split(' ')[0]}
                </button>
              </Link>
              <button 
                onClick={logout} 
                className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-l border-surface-border pl-4 ml-2">
              {mounted && (
                <Link href="/auth/login" className="text-sm font-bold text-foreground hover:text-accent transition-colors">
                  Sign In
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full bg-surface text-foreground hover:bg-surface-border transition-colors"
            aria-label="Toggle theme"
          >
            {mounted && theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-foreground focus:outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-background/40 px-4 py-4 backdrop-blur-3xl shadow-xl">
          <div className="flex flex-col space-y-4">
            <Link href="/catalog" className="text-base font-medium text-foreground hover:text-accent" onClick={() => setIsOpen(false)}>
              Gear Catalog
            </Link>
            <Link href="/how-it-works" className="text-base font-medium text-foreground hover:text-accent" onClick={() => setIsOpen(false)}>
              How It Works
            </Link>
            <Link href="/faq" className="text-base font-medium text-foreground hover:text-accent" onClick={() => setIsOpen(false)}>
              FAQ
            </Link>
            <Link href="/cart" className="w-full" onClick={() => setIsOpen(false)}>
              <button className="relative flex items-center justify-center gap-2 w-full rounded-md bg-accent px-4 py-3 text-sm font-bold text-white transition-all hover:bg-accent-hover">
                <ShoppingCart className="h-4 w-4" />
                <span>Cart</span>
                {mounted && cartItemsCount > 0 && (
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[12px] font-bold text-accent">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </Link>

            {/* Mobile Auth */}
            {mounted && user ? (
              <div className="border-t border-surface-border pt-4 mt-2">
                <Link href={user.role === 'admin' ? '/dashboard/admin' : '/dashboard/user'} onClick={() => setIsOpen(false)}>
                  <button className="flex items-center gap-2 w-full rounded-md bg-surface border border-surface-border px-4 py-3 text-sm font-bold text-foreground mb-3 transition-all">
                    <User className="h-4 w-4 text-accent" />
                    {user.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
                  </button>
                </Link>
                <button 
                  onClick={() => { logout(); setIsOpen(false); }}
                  className="flex items-center justify-center gap-2 w-full text-sm font-bold text-red-500 hover:text-red-400 py-2 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="border-t border-surface-border pt-4 mt-2">
                {mounted && (
                  <Link href="/auth/login" className="w-full block" onClick={() => setIsOpen(false)}>
                    <button className="w-full flex justify-center rounded-md border border-surface-border bg-background px-4 py-3 text-sm font-bold text-foreground hover:bg-surface">
                      Sign In / Register
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
