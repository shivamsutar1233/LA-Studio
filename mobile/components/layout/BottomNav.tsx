"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react";

const BottomNav = () => {
    const pathname = usePathname();

    const navItems = [
        { label: "Home", icon: Home, path: "/" },
        { label: "Catalog", icon: LayoutGrid, path: "/catalog" },
        { label: "Cart", icon: ShoppingCart, path: "/cart" },
        { label: "Profile", icon: User, path: "/dashboard" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-surface-border/50 pb-safe z-50 px-6">
            <div className="flex justify-between items-center h-20">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    // Check if the current path starts with the item's path (e.g. /dashboard/user should match /dashboard)
                    const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-95 ${isActive
                                ? "text-accent"
                                : "text-muted-foreground/60"
                                }`}
                        >
                            <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-accent/10' : ''}`}>
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[10px] mt-1 font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
