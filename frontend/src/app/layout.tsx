import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lean Angle Studio | Turn Miles into Memories",
  description: "Turn Miles into Memories with our premium moto vlogging gear rental. GoPros, Insta360s, Mic setups and helmet mounts.",
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth scroll-pt-20" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
          <Toaster position="bottom-right" theme="system" />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </html>
  );
}
