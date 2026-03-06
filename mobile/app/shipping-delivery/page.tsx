export default function ShippingDeliveryPage() {
    return (
        <div className="w-full py-8 pb-24 px-4">
            <h1 className="text-3xl font-black text-foreground mb-8 tracking-tight">Shipping</h1>

            <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-2">1. Delivery Time</h2>
                    <p>
                        Standard: 3-5 days. Expedited: 1-2 days. Estimates start from dispatch date.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-foreground mb-2">2. Processing</h2>
                    <p>
                        Orders before 2 PM process same day. Weekend orders process next business day.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-foreground mb-2">3. Costs</h2>
                    <p>
                        Free standard shipping on orders over ₹5,000.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-foreground mb-2">4. Returns</h2>
                    <p>
                        Pre-paid label included. Re-use original packaging and drop at the carrier on your last rental day.
                    </p>
                </section>
            </div>
        </div>
    );
}
