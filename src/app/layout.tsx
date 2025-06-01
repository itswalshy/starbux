import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google'; // Using a standard clean font

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans', // Using sans as the main variable
});

export const metadata: Metadata = {
  title: 'TipJar - Tip Calculator',
  description: 'Easily calculate and distribute tips for partners.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head />
      <body className="font-sans antialiased min-h-screen flex flex-col bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
