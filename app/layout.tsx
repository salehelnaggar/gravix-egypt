import type { Metadata } from 'next'
import './globals.css'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: 'GRAVIX EGYPT — Live Events & DJs',
  description:
    "Book Egypt's hottest live events, concerts, and DJs in one place. Standing & backstage tickets, secure payments, and instant confirmation.",
  openGraph: {
    title: 'GRAVIX EGYPT — Live Events & DJs',
    description:
      "Book Egypt's hottest live events, concerts, and DJs in one place. Standing & backstage tickets, secure payments, and instant confirmation.",
    url: 'https://gravixegypt.online',
    siteName: 'GRAVIX EGYPT',
    type: 'website',
    images: [
      {
        url: 'https://gravixegypt.online/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'GRAVIX EGYPT — Live Events',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GRAVIX EGYPT — Live Events & DJs',
    description:
      "Book Egypt's hottest live events, concerts, and DJs in one place.",
    images: ['https://gravixegypt.online/og-home.jpg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#050505',
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <Navbar />
        {children}
      </body>
    </html>
  )
}
