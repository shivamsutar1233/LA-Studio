export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 w-full flex-grow">
      <h1 className="text-4xl font-extrabold text-foreground mb-8">Privacy Policy</h1>
      
      <div className="prose prose-invert max-w-none text-muted-foreground space-y-6">
        <p>
          Last updated: [Current Date]
        </p>
        <p>
          Lean Angle Studio ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our website or rent our equipment.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">1. Information We Collect</h2>
        <p>
          We collect personal data that you provide directly to us when creating an account, booking a rental, or contacting our support team. This may include your name, email address, phone number, shipping address, and payment information.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">2. How We Use Your Information</h2>
        <p>
          We use your information to:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Process and fulfill your rental orders.</li>
          <li>Communicate with you regarding your bookings, shipping updates, and customer support.</li>
          <li>Improve our website, services, and inventory selection.</li>
          <li>Prevent fraud and ensure the security of our platform.</li>
          <li>Send marketing communications, if you have opted in.</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-8">3. Information Sharing</h2>
        <p>
          We do not sell or rent your personal data to third parties. We may share your information with trusted service providers who assist us in operating our business, such as payment processors and shipping carriers. These partners are required to keep your information confidential.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">4. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, loss, or alteration. All payment transactions are encrypted using secure socket layer technology (SSL).
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">5. Your Rights</h2>
        <p>
          You have the right to access, correct, or delete your personal data. You can manage your account information through your User Dashboard or by contacting us. You may also opt out of marketing communications at any time.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">6. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices or for legal reasons. We will notify you of any significant changes by posting the new policy on this page.
        </p>
      </div>
    </div>
  );
}
