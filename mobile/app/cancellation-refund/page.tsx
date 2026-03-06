export default function CancellationRefundPage() {
    return (
        <div className="w-full py-8 pb-24 px-4">
            <h1 className="text-3xl font-black text-foreground mb-8 tracking-tight">Refunds</h1>

            <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-2">1. Cancellations</h2>
                    <p>
                        Full refund up to 48 hours before shipping. Manage via Dashboard or Support.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-foreground mb-2">2. Late Cancellation</h2>
                    <p>
                        Within 48 hours of shipping: 25% restocking fee. Shipped orders cannot be cancelled.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-foreground mb-2">3. Processing</h2>
                    <p>
                        Refunds take 5-7 business days to appear on your statement after approval.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-foreground mb-2">4. Defects</h2>
                    <p>
                        Report issues within 12 hours of delivery for immediate replacement or full refund.
                    </p>
                </section>
            </div>
        </div>
    );
}
