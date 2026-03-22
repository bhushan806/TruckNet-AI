'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0B1121',
                    color: 'white',
                    padding: '1rem',
                    fontFamily: 'system-ui, sans-serif',
                }}>
                    <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
                        <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '1rem' }}>
                            500
                        </h1>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                            Something went wrong
                        </h2>
                        <p style={{ color: '#94A3B8', marginBottom: '2rem' }}>
                            An unexpected error occurred. Please try again.
                        </p>
                        <button
                            onClick={() => reset()}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#22d3ee',
                                color: '#000',
                                fontWeight: '600',
                                borderRadius: '0.75rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
