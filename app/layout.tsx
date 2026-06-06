import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mindscapepsychology.com'),
  title: {
    default: 'MindScape — Psychology Insights & Mental Wellness',
    template: '%s | MindScape Psychology',
  },
  description:
    'Evidence-based psychology articles, mental wellness resources, memory training games, and curated book recommendations for your psychological journey.',
  keywords: ['psychology', 'mental health', 'CBT', 'mindfulness', 'therapy', 'neuroscience'],
  authors: [{ name: 'Dr. Elena Hartmann' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'MindScape Psychology',
    images: [{ url: 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <meta name="google-site-verification" content="NHQrkG6Stu5Dcp30aHpZKGJfoKtoBGPyKdsPPv6ZraU" />
        {/* Google AdSense - replace ca-pub-XXX with your publisher ID */}
        {/* <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXX" crossOrigin="anonymous"></script> */}
      </head>
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
