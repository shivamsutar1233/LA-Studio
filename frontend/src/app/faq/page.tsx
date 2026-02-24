import { ChevronDown } from 'lucide-react';

export default function FAQPage() {
  const faqs = [
    {
      q: "What condition is the gear in?",
      a: "All gear is maintained in excellent condition. We inspect, clean, and test every item before it ships to ensure it works flawlessly."
    },
    {
      q: "Do I need to clean the gear before returning it?",
      a: "No heavy cleaning is required, but please try to wipe off major dirt or mud. We professionally sanitize all equipment upon return."
    },
    {
      q: "What is the security deposit?",
      a: "A standard, refundable security deposit is held on your card during the rental period to cover potential damages. It is released immediately upon the safe return of the gear."
    },
    {
      q: "Can I take the gear off-road or track racing?",
      a: "Yes! Our gear and mounts are designed for extreme riding. However, you are responsible for any damage if you crash. We recommend adding our optional Damage Protection plan at checkout."
    },
    {
      q: "Are memory cards included?",
      a: "Yes, all cameras come with a high-speed microSD card (usually 128GB or 256GB) formatted and ready to use. You must transfer your footage before returning the gear."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 w-full flex-grow">
      <h1 className="text-4xl font-extrabold text-foreground mb-8 text-center">Frequently Asked Questions</h1>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <details key={index} className="group bg-surface border border-surface-border rounded-xl p-6 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex items-center justify-between cursor-pointer font-bold text-lg text-foreground">
              {faq.q}
              <ChevronDown className="h-5 w-5 text-muted-foreground group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {faq.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
