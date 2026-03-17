import React from "react"
import type { Metadata } from 'next'
import { Ubuntu, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const ubuntu = Ubuntu({ 
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: '--font-ubuntu'
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains'
});

export const metadata: Metadata = {
  title: 'VANT - The Fastest Prediction Market Terminal for West Africa',
  description: 'Trade crypto predictions, sports wagers, and custom markets on Solana. Built for the Nigerian market with instant payouts.',
  generator: 'v0.app',
  metadataBase: new URL('https://vant.davidnzube.xyz'),
  openGraph: {
    title: 'VANT - Prediction & Wagering Terminal',
    description: 'The fastest prediction terminal for BTC, ETH, and SOL.',
    type: 'website',
    url: 'https://vant.davidnzube.xyz',
    locale: 'en_NG',
    siteName: 'VANT',
    images: [
      {
        url: 'https://vant.davidnzube.xyz/media/images/banners/banner1.png',
        width: 1200,
        height: 630,
        alt: 'VANT - Prediction & Wagering Terminal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VANT - Prediction & Wagering Terminal',
    description: 'The fastest prediction terminal for BTC, ETH, and SOL.',
    images: ['https://vant.davidnzube.xyz/media/images/banners/banner1.png'],
    creator: '@vant_xyz',
  },
  keywords: ['prediction market', 'crypto', 'Solana', 'Nigeria', 'wagering', 'BTC', 'ETH', 'SOL', 'Vant VS'],
  authors: [{ name: 'VANT' }],
  creator: 'VANT',
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${ubuntu.variable} ${jetbrainsMono.variable} font-sans antialiased bg-black text-white`}>
        {children}
        <Analytics />
        <Toaster
          position="top-center"
          toastOptions={{
            className: 'bg-gray-900 border border-gray-800 text-white',
            duration: 4000,
            success: {
              className: 'bg-gray-900 border border-green-500/50 text-white',
            },
            error: {
              className: 'bg-gray-900 border border-red-500/50 text-white',
            },
          }}
        />
      </body>
    </html>
  )
}
