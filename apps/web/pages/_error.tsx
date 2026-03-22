import Link from 'next/link';

function Error({ statusCode }: { statusCode: number }) {
    const isNotFound = statusCode === 404;

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0B1121',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                margin: 0,
                padding: '1rem',
            }}
        >
            <div style={{ textAlign: 'center', maxWidth: '32rem' }}>
                <div
                    style={{
                        fontSize: '5rem',
                        fontWeight: 'bold',
                        color: isNotFound ? '#22d3ee' : '#ef4444',
                        marginBottom: '1rem',
                    }}
                >
                    {statusCode || 'Error'}
                </div>
                <h1
                    style={{
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '0.5rem',
                    }}
                >
                    {isNotFound ? 'Page Not Found' : 'Something Went Wrong'}
                </h1>
                <p
                    style={{
                        color: '#94A3B8',
                        marginBottom: '2rem',
                        lineHeight: '1.5',
                    }}
                >
                    {isNotFound
                        ? "The page you're looking for doesn't exist."
                        : 'An unexpected error occurred. Please try again later.'}
                </p>
                <Link
                    href="/"
                    style={{
                        display: 'inline-block',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#22d3ee',
                        color: '#000000',
                        textDecoration: 'none',
                        fontWeight: '600',
                        borderRadius: '0.75rem',
                    }}
                >
                    ← Back to Home
                </Link>
            </div>
        </div>
    );
}

Error.getInitialProps = ({ res, err }: any) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode };
};

export default Error;
