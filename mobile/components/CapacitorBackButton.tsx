"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export default function CapacitorBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backButtonListener = App.addListener('backButton', () => {
      // Define root paths where pressing back should exit the app
      const rootPaths = ['/', '/dashboard', '/dashboard/admin', '/auth/login'];
      
      if (rootPaths.includes(pathname)) {
        App.exitApp();
      } else {
        router.back();
      }
    });
      // Check if we have history in the Next.js router
      // The browser history length includes the initial load, so > 1 means we can go back
    return () => {
      backButtonListener.then((listener) => listener.remove());
    };
  }, [router, pathname]);

  return null;
}
