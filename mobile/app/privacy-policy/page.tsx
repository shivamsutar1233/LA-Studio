export default function PrivacyPolicyPage() {
    return (
        <div className="w-full py-8 pb-24 px-4">
            <h1 className="text-3xl font-black text-foreground mb-8 tracking-tight">Privacy</h1>

            <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
                <p className="font-bold text-accent italic">Last updated: March 2026</p>

                <section>
                    <h2 className="text-lg font-bold text-foreground mb-2">1. Collection</h2>
                    <p>
                        We collect data provided during account creation and booking: name, email, shipping address, and payment info.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-foreground mb-2">2. Usage</h2>
                    <p>
                        Your data is used to fulfill orders, communicate updates, and improve our services.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-foreground mb-2">3. Sharing</h2>
                    <p>
                        We never sell your data. We share only with trusted partners like payment processors and carriers to handle your rental.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-foreground mb-2">4. Security</h2>
                    <p>
                        Industry-standard encryption (SSL) protects all transactions and personal information.
                    </p>
                </section>
            </div>
        </div>
    );
}
