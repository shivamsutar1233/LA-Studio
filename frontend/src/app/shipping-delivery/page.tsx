export default function ShippingDeliveryPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 w-full flex-grow">
      <h1 className="text-4xl font-extrabold text-foreground mb-8">Shipping and Delivery Policy</h1>
      
      <div className="prose prose-invert max-w-none text-muted-foreground space-y-6">
        <p>
          At Lean Angle Studio, we are committed to ensuring your moto vlogging gear arrives on time and in perfect working condition. Please read our shipping and delivery policy below.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">1. Delivery Timeframes</h2>
        <p>
          We offer standard and expedited shipping options. Standard delivery typically takes 3-5 business days, while expedited delivery takes 1-2 business days. Delivery times are estimates and commence from the date of shipping, rather than the date of your order.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">2. Order Processing</h2>
        <p>
          Orders placed before 2:00 PM (local time) on business days are processed and dispatched the same day. Orders placed after 2:00 PM or on weekends/holidays will be processed the following business day.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">3. Shipping Costs</h2>
        <p>
          Shipping costs are calculated at checkout based on the weight of the equipment and the delivery address. We offer free standard shipping on all rental orders over ₹5,000.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">4. Return Shipping</h2>
        <p>
          A pre-paid return shipping label is included with your rental. On the last day of your rental period, simply pack the gear securely in its original packaging, affix the return label, and drop it off at the designated carrier location.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">5. Damaged or Lost Packages</h2>
        <p>
          If your package arrives damaged or is lost in transit, please contact our support team immediately. Do not accept a damaged package from the courier. We will expedite a replacement order to ensure your shoot is not impacted.
        </p>
      </div>
    </div>
  );
}
