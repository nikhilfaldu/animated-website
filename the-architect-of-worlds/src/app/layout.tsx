import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Architect of Worlds',
  description:
    'An immersive cinematic 3D journey through handcrafted worlds floating in deep space. Built for the 3D Web Hackathon.',
  keywords: ['3D', 'WebGL', 'Three.js', 'interactive', 'immersive', 'cinematic', 'hackathon'],
  authors: [{ name: 'The Architect' }],
  openGraph: {
    title: 'The Architect of Worlds',
    description: 'An immersive cinematic 3D journey through handcrafted worlds.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  )
}
