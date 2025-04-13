import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BombasticTool - Your Modern Dashboard',
  description: 'A modern dashboard with Clerk authentication',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the environment to check if we're in development or production
  const isProduction = process.env.NODE_ENV === 'production';
  
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          {isProduction && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_') && (
            <div className="bg-yellow-100 text-yellow-800 p-4 text-center text-sm">
              ⚠️ Warning: Using development Clerk keys in production. Please update to production keys.
            </div>
          )}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
} 