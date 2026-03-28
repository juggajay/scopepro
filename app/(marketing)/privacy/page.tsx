import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <article className="prose mx-auto max-w-3xl px-4 py-16">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: March 2026</p>

      <h2>1. Information We Collect</h2>
      <p>
        When you create a ScopePro account, we collect your email address and
        password. If you complete your business profile, we also collect your
        business name, ABN, license number, phone number, and address. When you
        use ScopePro, we collect the photos you upload and job descriptions you
        enter.
      </p>

      <h2>2. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Provide and improve the ScopePro service</li>
        <li>Generate AI-powered scopes of work from your photos and descriptions</li>
        <li>Process credit purchases via Stripe</li>
        <li>Send scope documents to your clients via email</li>
        <li>Communicate important service updates</li>
      </ul>

      <h2>3. AI Processing</h2>
      <p>
        Photos and descriptions you submit are processed by Google Gemini AI to
        generate scope items. Your data is sent to Google&apos;s API for
        processing and is subject to Google&apos;s data handling policies. We do
        not use your data to train AI models.
      </p>

      <h2>4. Data Storage</h2>
      <p>
        Your data is stored on Convex Cloud servers. Photos are stored in Convex
        file storage. Payment information is handled entirely by Stripe — we
        never store your credit card details.
      </p>

      <h2>5. Data Sharing</h2>
      <p>
        We share your data only with the third-party services required to
        operate ScopePro:
      </p>
      <ul>
        <li>
          <strong>Google Gemini</strong> — for AI scope generation
        </li>
        <li>
          <strong>Stripe</strong> — for payment processing
        </li>
        <li>
          <strong>Resend</strong> — for email delivery
        </li>
        <li>
          <strong>Convex</strong> — for data storage and backend
        </li>
      </ul>
      <p>We do not sell your data to third parties.</p>

      <h2>6. Your Rights</h2>
      <p>
        You can delete your account at any time from your account settings. This
        permanently deletes all your data including scopes, photos, and profile
        information. Tracking links for previously sent scopes will show a
        &quot;no longer available&quot; message.
      </p>

      <h2>7. Contact</h2>
      <p>
        For privacy enquiries, email{" "}
        <a href="mailto:privacy@scopepro.com.au">privacy@scopepro.com.au</a>.
      </p>
    </article>
  );
}
