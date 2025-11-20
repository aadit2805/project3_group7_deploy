import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { OrderProvider } from './context/OrderContext';
import { TranslationProvider } from './context/TranslationContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Project 3 - Group 7',
  description: 'Next.js 15 + TypeScript Frontend',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <TranslationProvider>
          <OrderProvider>{children}</OrderProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}
