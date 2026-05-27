import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Amantran CMS — Canva Wedding Invitation Admin Panel',
  description: 'Manage wedding templates, custom typography fonts, locales languages, invitation categories, and drag-and-drop designer canvas structures dynamically.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-[#FDFBF7] text-[#1E1D1E]">
        {children}
      </body>
    </html>
  );
}
