"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if user has already dismissed or installed
    const hasDismissed = localStorage.getItem('pwa-install-dismissed')
    if (hasDismissed) {
      return
    }

    // Only show on desktop and after a delay
    const isDesktop = window.innerWidth > 768
    if (!isDesktop) {
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      
      // Show prompt after 5 seconds
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setShowPrompt(false)
        setDeferredPrompt(null)
      }
    } catch (err) {
      console.error('Error installing PWA:', err)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for 30 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-600 rounded" />
              <h3 className="font-semibold text-white">Install Vantic</h3>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Install Vantic for quick access to your trading dashboard. Get instant notifications and offline support.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="bg-red-600 text-white hover:bg-red-500"
              >
                Install
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="outline"
                className="border-gray-700 text-gray-400 hover:text-white"
              >
                Later
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
