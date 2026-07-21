import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import '@gnolith/waystone/styles.css';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get('x-forwarded-host') ??
    requestHeaders.get('host') ??
    'localhost';
  const protocol =
    requestHeaders.get('x-forwarded-proto') ??
    (host.startsWith('localhost') ? 'http' : 'https');
  const title = 'Waystone Canary';
  const description =
    'Production consumer and deployment canary for the Gnolith knowledge interface.';
  return {
    metadataBase: new URL(`${protocol}://${host}`),
    title: { default: title, template: `%s - ${title}` },
    description,
    icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: '/og.png',
          width: 1792,
          height: 896,
          alt: 'Waystone - The human interface to Gnolith knowledge',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og.png'],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
