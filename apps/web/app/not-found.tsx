'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Truck, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:bg-slate-950 dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-20"></div>
            
            <div className="space-y-6 max-w-md mx-auto">
                <div className="relative inline-block">
                    <div className="p-6 rounded-full bg-primary/10 animate-pulse">
                        <Truck className="h-16 w-16 text-primary" />
                    </div>
                </div>
                
                <h1 className="text-6xl font-bold tracking-tighter">404</h1>
                <h2 className="text-2xl font-semibold">Route Not Found</h2>
                <p className="text-muted-foreground">
                    The shipment you're looking for seems to have taken a wrong turn. 
                    Let's get you back on the right track.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button asChild variant="default" size="lg" className="shadow-lg shadow-primary/20">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Back to Home
                        </Link>
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => window.history.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
}
