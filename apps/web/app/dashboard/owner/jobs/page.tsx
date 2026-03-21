'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot, Search } from 'lucide-react';
import Link from 'next/link';

export default function FindJobsPage() {
    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Link href="/dashboard/owner" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold">Find New Jobs</h1>
                    <p className="text-muted-foreground">Use AI to find loads for idle trucks.</p>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-8 text-center space-y-4">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <Bot className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-blue-900">AI Load Assistant</h2>
                <p className="text-blue-700 max-w-lg mx-auto">
                    Our AI is analyzing market demand and your fleet location to recommend the best high-paying loads.
                </p>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Search className="mr-2 h-4 w-4" /> Start Searching
                </Button>
            </div>
        </div>
    );
}
