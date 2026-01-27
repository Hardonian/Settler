import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../src/app/globals.css';

export const metadata: Metadata = {
  title: 'Settler',
  description: 'Settler application',
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}
