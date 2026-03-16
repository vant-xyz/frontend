import React from "react"
import type { Metadata } from 'next'
import { Ubuntu, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
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
  openGraph: {
    title: 'VANT',
    description: 'The fastest prediction terminal for BTC, ETH, and SOL. Built for the Nigerian market.',
    type: 'website',
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
      </body>
    </html>
  )
}
