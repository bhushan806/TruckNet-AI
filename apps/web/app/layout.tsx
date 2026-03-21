import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from '@/lib/auth-context';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import AIAssistant from "@/components/ai/AIAssistant";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space' });

export const metadata: Metadata = {
  title: "TruckNet India — AI-Powered Logistics Platform",
  description: "Next-Gen AI-Powered Logistics Platform for the Indian transportation market. Connecting Fleet Owners, Drivers, and Transporters.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`} suppressHydrationWarning>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 pt-4 pb-16 md:py-8 overflow-x-hidden">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
            <footer className="border-t py-6 md:py-0">
              <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                  © {new Date().getFullYear()} TruckNet India. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
          <AIAssistant />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
