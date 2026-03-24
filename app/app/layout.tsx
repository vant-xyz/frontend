import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Trade Crypto & Sports',
  description: 'Trade BTC, ETH, SOL predictions and sports wagers with instant payouts. Naira-first trading on Solana.',
  openGraph: {
    title: 'Vantic Dashboard - Trade Crypto & Sports',
    description: 'Trade BTC, ETH, SOL predictions and sports wagers with instant payouts.',
  },
  twitter: {
    title: 'Vantic Dashboard - Trade Crypto & Sports',
    description: 'Trade BTC, ETH, SOL predictions and sports wagers with instant payouts.',
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
