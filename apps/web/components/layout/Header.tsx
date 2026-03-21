'use client';

import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Sheet import removed
import { Sidebar } from './Sidebar';

// I need to check if Sheet exists. If not, I'll use a simple mobile menu or just hide sidebar on mobile for now and rely on a basic toggle.
// Actually, for a premium feel, I should implement a Sheet (Drawer).
// But to save time and complexity, I will implement a simple mobile menu toggle state within the layout or use a simple conditional render.
// Let's assume I will create a simple Header that just shows the title for now, and I'll handle mobile sidebar in the layout.

export function Header({ title }: { title?: string }) {
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex-1">
                <h1 className="text-lg font-semibold">{title || 'Dashboard'}</h1>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Bell className="h-4 w-4" />
                    <span className="sr-only">Notifications</span>
                </Button>
            </div>
        </header>
    );
}
