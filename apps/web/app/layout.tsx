import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from '@/lib/auth-context';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import ClientAIAssistant from '@/components/ai/ClientAIAssistant';
import { Toaster } from 'sonner';
import { ServerWakeUp } from '@/components/ui/ServerWakeUp';

import { LanguageProvider } from '@/lib/language-context';

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space' });

export const metadata: Metadata = {
  title: "TruckNet India — Smart Trucking & Logistics Platform",
  description: "Next-Gen Logistics Platform for the Indian transportation market. Connecting Fleet Owners, Drivers, and Transporters.",
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
          <LanguageProvider>
            <ServerWakeUp>
              <div className="flex flex-col min-h-screen bg-[#0B1120] text-[#F8FAFC]">
                <Navbar />
                <main className="flex-1 overflow-x-hidden">
                  <ErrorBoundary>{children}</ErrorBoundary>
                </main>
              </div>
              <ClientAIAssistant />
              <Toaster position="top-center" richColors closeButton />
            </ServerWakeUp>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
