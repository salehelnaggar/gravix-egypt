import type { Metadata } from 'next'
import './globals.css'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: 'Gravix Egypt — Live Events',
  description: "Egypt's #1 Live Events Platform",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
