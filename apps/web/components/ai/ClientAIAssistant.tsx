'use client';

import dynamic from 'next/dynamic';

// Dynamically import AIAssistant with ssr:false
// This MUST be in a Client Component (not in app/layout.tsx which is a Server Component)
const AIAssistant = dynamic(() => import('@/components/ai/AIAssistant'), {
    ssr: false,
    loading: () => null,
});

export default function ClientAIAssistant() {
    return <AIAssistant />;
}
