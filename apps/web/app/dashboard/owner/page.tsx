'use client';

import dynamic from 'next/dynamic';

const OwnerClient = dynamic(() => import('./OwnerClient'), { ssr: false });

export default function Page() {
    return <OwnerClient />;
}
