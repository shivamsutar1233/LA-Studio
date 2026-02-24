export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 w-full flex-grow">
      <h1 className="text-4xl font-extrabold text-foreground mb-8">Terms of Service</h1>
      
      <div className="prose prose-invert max-w-none text-muted-foreground space-y-6">
        <p>
          Welcome to Lean Angle Studio. By renting our equipment, you agree to the following terms and conditions.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">1. Rental Period</h2>
        <p>
          The rental period begins on the day the equipment is delivered to you and ends on the day you drop off the return package at the designated carrier. Late returns will be subject to a daily fee equal to 1.5x the daily rental rate.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">2. Equipment Condition and Liability</h2>
        <p>
          You are expected to return all gear in the same condition it was received, ordinary wear and tear excepted. You are fully responsible for the cost of repair or replacement for any completely lost or severely damaged items unless you purchased our optional Damage Protection plan.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">3. Security Deposit</h2>
        <p>
          A refundable security deposit will be authorized on your credit card at the time of booking. This deposit will be released within 48 hours of us receiving and inspecting the returned gear.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">4. Cancellation Policy</h2>
        <p>
          You may cancel your reservation for a full refund up to 48 hours before the scheduled shipping date. Cancellations made within 48 hours of the shipping date are subject to a 25% restocking fee.
        </p>
      </div>
    </div>
  );
}
