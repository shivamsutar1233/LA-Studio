'use client';

import { ChevronDown } from 'lucide-react';

export default function FAQPage() {
    const faqs = [
        {
            q: "What condition is the gear in?",
            a: "All gear is maintained in excellent condition. We inspect, clean, and test every item before it ships to ensure it works flawlessly."
        },
        {
            q: "Do I need to clean the gear?",
            a: "No heavy cleaning is required, but please try to wipe off major dirt or mud. We professionally sanitize all equipment upon return."
        },
        {
            q: "What is the security deposit?",
            a: "A standard, refundable security deposit is held on your card during the rental period. It is released immediately upon the safe return of the gear."
        },
        {
            q: "Can I take gear off-road?",
            a: "Yes! Our gear and mounts are designed for extreme riding. However, you are responsible for any damage if you crash. We recommend adding our Damage Protection plan."
        },
        {
            q: "Are memory cards included?",
            a: "Yes, all cameras come with a high-speed microSD card (128GB+) formatted and ready to use. transfer your footage before returning."
        }
    ];

    return (
        <div className="w-full py-8 pb-24 px-4">
            <h1 className="text-3xl font-black text-foreground mb-8 tracking-tight">FAQ</h1>

            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <details key={index} className="group bg-surface/50 border border-surface-border/50 rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden">
                        <summary className="flex items-center justify-between cursor-pointer font-bold text-base text-foreground">
                            {faq.q}
                            <ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
                        </summary>
                        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                            {faq.a}
                        </p>
                    </details>
                ))}
            </div>
        </div>
    );
}
