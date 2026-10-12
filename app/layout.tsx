import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'University Life Management Survey - Executive Research Dashboard',
  description: 'Assessing the Need for a University Life Management Foundation Course: Exploring Students’ Experiences, Challenges and Support Needs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
