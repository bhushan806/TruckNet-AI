'use client';

import dynamic from 'next/dynamic';

const PostLoadClient = dynamic(() => import('./PostLoadClient'), { ssr: false });

export default function Page() {
    return <PostLoadClient />;
}
