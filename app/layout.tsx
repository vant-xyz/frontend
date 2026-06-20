import React from "react"
import type { Metadata, Viewport } from 'next'
import { Ubuntu, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { PWAInstallPrompt } from '@/components/pwa/install-prompt'
import { MaintenanceGate } from '@/components/system/maintenance-gate'
import { SolanaWalletProvider } from '@/components/providers/wallet-provider'
import NextTopLoader from 'nextjs-toploader'
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
}

export const metadata: Metadata = {
  title: {
    default: 'Vantic - The Fastest Prediction Market Terminal on Solana',
    template: '%s | Vantic'
  },
  description: 'Trade crypto predictions, sports wagers, and custom markets on Solana. Onchain verifiable markets with instant USDC payouts.',
  metadataBase: new URL('https://vantic.xyz'),
  alternates: {
    canonical: 'https://vantic.xyz',
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
  openGraph: {
    title: 'Vantic - Prediction & Wagering Terminal',
    description: 'The fastest prediction terminal for BTC, ETH, SOL predictions and custom wagers on Solana.',
    type: 'website',
    url: 'https://vantic.xyz',
    locale: 'en_US',
    siteName: 'Vantic',
    images: [
      {
        url: 'https://vantic.xyz/media/images/banners/banner1.png',
        width: 1200,
        height: 630,
        alt: 'Vantic - Prediction & Wagering Terminal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vantic - Prediction & Wagering Terminal',
    description: 'The fastest prediction terminal for BTC, ETH, and SOL.',
    images: ['https://vantic.xyz/media/images/banners/banner1.png'],
    creator: '@vanticxyz',
  },
  keywords: [
    'prediction market',
    'crypto',
    'Solana',
    'wagering',
    'BTC',
    'ETH',
    'SOL',
    'Vantic VS',
    'crypto predictions',
    'onchain verifiable markets',
    'OVM',
    'sports betting',
    'P2P wagering',
    'instant payouts',
    'USDC',
    'DeFi'
  ],
  authors: [{ name: 'Vantic' }],
  creator: 'Vantic',
  publisher: 'Vantic',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icon.png',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vantic',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#dc2626" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Vantic" />
      </head>
      <body className={`${ubuntu.variable} ${jetbrainsMono.variable} font-sans antialiased bg-black text-white`}>
        <NextTopLoader color="#dc2626" height={2} showSpinner={false} shadow="0 0 10px #dc2626, 0 0 5px #dc2626" />
        <SolanaWalletProvider>
          <MaintenanceGate>{children}</MaintenanceGate>
          <PWAInstallPrompt />
          <Analytics />
          <Toaster
            position="top-center"
            theme="dark"
            toastOptions={{
              className: 'bg-zinc-900 border border-zinc-700 text-white',
              duration: 4000,
            }}
          />
        </SolanaWalletProvider>
      </body>
    </html>
  )
}
