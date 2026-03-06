import React from "react";
import BottomNav from "./BottomNav";

interface MobileLayoutProps {
    children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
            {/* Header for mobile could be added here if needed */}
            <main className="flex-1 pb-20 overflow-y-auto px-4 pt-4">
                {children}
            </main>
            <BottomNav />
        </div>
    );
};

export default MobileLayout;
