"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader } from "@/components/ui/loader"

function CallbackHandler() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const token = params.get("token")
    const error = params.get("error")

    if (error || !token) {
      router.replace("/?auth_error=" + (error ?? "unknown"))
      return
    }

    localStorage.setItem("auth_token", token)
    document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

    fetch("/api/vcs/user", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user))
        }
      })
      .catch(() => {})
      .finally(() => {
        router.replace("/app")
      })
  }, [])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader className="w-8 h-8 text-red-500" />
        <p className="text-gray-400 text-sm">Signing you in...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader className="w-8 h-8 text-red-500" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  )
}
