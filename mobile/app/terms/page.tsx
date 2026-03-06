export default function TermsPage() {
    return (
        <div className="w-full py-8 pb-24 px-4">
            <h1 className="text-3xl font-black text-foreground mb-8 tracking-tight">Terms</h1>

            <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-2">1. Rental Period</h2>
                    <p>
                        Begins on delivery and ends on carrier drop-off. Late returns incur a 1.5x daily fee.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-foreground mb-2">2. Liability</h2>
                    <p>
                        Return gear in original condition. You are responsible for repair or replacement costs unless Damage Protection was purchased.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-foreground mb-2">3. Deposit</h2>
                    <p>
                        A refundable authorization is held during the rental and released within 48 hours of inspection.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-foreground mb-2">4. Cancellation</h2>
                    <p>
                        Full refund up to 48 hours before shipping. Later cancellations incur a 25% restocking fee.
                    </p>
                </section>
            </div>
        </div>
    );
}
