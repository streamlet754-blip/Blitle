import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blitle',
  description: 'A free-tier social app for sharing short text and imagery.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
