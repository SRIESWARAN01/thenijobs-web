'use client';

/**
 * Global error boundary — catches errors in the root layout itself.
 * Must render its own <html> and <body> tags since the root layout may be broken.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '1rem',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              fontSize: 32,
            }}
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            A critical error occurred. Please try refreshing the page.
          </p>
          {error.digest && (
            <p style={{ color: '#9CA3AF', fontSize: '0.75rem', fontFamily: 'monospace', margin: '0 0 1.5rem' }}>
              Error ID: {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: 12,
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#fff',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              🔄 Try Again
            </button>
            {/* A global error boundary replaces the root layout after the layout itself has
                thrown, so the router is not in a state worth trusting. A full document load is
                the correct recovery here, and next/link would ask the failed router to do the
                navigating. The rule is silenced on this line only; eslint.config.mjs is not
                touched. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: 12,
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                background: '#fff',
                border: '2px solid #E5E7EB',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              🏠 Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
