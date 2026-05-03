import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';
import { Providers } from '@/components/providers';
import './globals.css';

const appTitle = `${APP_NAME} - Dashboard`;

export const metadata: Metadata = {
  title: appTitle,
  description: 'Manage projects, track tasks, and collaborate with your team.',
  metadataBase: new URL('https://example.com'),
  openGraph: {
    title: appTitle,
    description: 'Manage projects, track tasks, and collaborate with your team.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: appTitle,
    description: 'Manage projects, track tasks, and collaborate with your team.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
