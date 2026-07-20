import PageTransition from '@/components/PageTransition';

export const metadata = {
  title: 'Privacy Policy — ContentFlow',
  description: 'Privacy Policy for ContentFlow social media management platform.',
};

export default function PrivacyPolicy() {
  return (
    <PageTransition>
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px', color: 'var(--text-primary)', fontFamily: 'var(--sans, system-ui, sans-serif)' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>Last updated: July 20, 2026</p>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>1. Information We Collect</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            ContentFlow (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) collects information to provide social media publishing and content approval services. When you connect your Google/YouTube account, we receive authorization tokens and profile information (channel ID, channel name, and profile thumbnail) authorized by you.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>2. How We Use YouTube API Data</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Our application uses YouTube API Services solely for:
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Displaying your connected YouTube Channel name and status within your account dashboard.</li>
            <li>Uploading approved video posts/shorts directly to your connected YouTube Channel at your request.</li>
            <li>Maintaining token health to ensure seamless scheduled publishing.</li>
          </ul>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 12 }}>
            We do not sell, transfer, or share your YouTube user data or access tokens with any third parties.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>3. Data Storage &amp; Security</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            All OAuth tokens are stored securely in encrypted databases using industry-standard access security protocols. You can disconnect your YouTube Channel at any time from your Client Settings page, which immediately deletes all stored tokens.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>4. Google Privacy Policy</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            By using our YouTube integration, you are also bound by the <a href="https://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent, #2563eb)' }}>Google Privacy Policy</a> and the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent, #2563eb)' }}>YouTube Terms of Service</a>. You can revoke ContentFlow&apos;s access to your Google Account at any time via <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent, #2563eb)' }}>Google Security Settings</a>.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>5. Contact Us</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            If you have any questions about this Privacy Policy, please contact support at <a href="mailto:support@contentflow.app" style={{ color: 'var(--accent, #2563eb)' }}>support@contentflow.app</a>.
          </p>
        </section>
      </div>
    </PageTransition>
  );
}
