export default function CancellationRefundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 w-full flex-grow">
      <h1 className="text-4xl font-extrabold text-foreground mb-8">Cancellation and Refund Policy</h1>
      
      <div className="prose prose-invert max-w-none text-muted-foreground space-y-6">
        <p>
          We understand that plans change. Our cancellation and refund policy is designed to be as flexible as possible while allowing us to manage our inventory effectively.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">1. Order Cancellations</h2>
        <p>
          You may cancel your rental reservation for a full refund up to 48 hours before the scheduled shipping date. To cancel an order, please visit your User Dashboard or contact our support team directly.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">2. Late Cancellations</h2>
        <p>
          Cancellations made within 48 hours of the scheduled shipping date will be subject to a 25% restocking fee. The remaining 75% of your rental fee will be refunded to your original payment method. Once an order has shipped, it cannot be cancelled.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">3. Early Returns</h2>
        <p>
          We do not offer refunds or prorated credits for equipment returned before the end of your scheduled rental period. 
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">4. Refund Processing</h2>
        <p>
          Approved refunds will be processed automatically to your original method of payment. Please allow 5-7 business days for the credit to appear on your bank statement, depending on your card issuer's policies.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">5. Defective Equipment</h2>
        <p>
          If you receive defective or non-functioning equipment, please notify us within 12 hours of delivery. We will arrange for an immediate replacement or issue a full refund for the defective item along with associated shipping costs.
        </p>
      </div>
    </div>
  );
}
