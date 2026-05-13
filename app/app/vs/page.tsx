"use client"

import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { Button } from "@/components/ui/button"
import { CreateEventModal } from "@/components/ui/createEventModal"
import { Input } from "@/components/ui/input"
import { getVsEvents, vsEvents } from "@/lib/api"
import { ArrowRight, Swords } from "lucide-react"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function VSPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [myEvents, setMyEvents] = useState<vsEvents[]>([])

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (!token) return
    getVsEvents(token)
      .then((res) => setMyEvents(res.events || []))
      .catch(() => {})
  }, [])

  const handleLoad = () => {
    const trimmed = code.trim()
    if (!trimmed) return
    router.push(`/app/vs/${trimmed}`)
  }

  return (
    <DashboardClient>
      <div className="max-w-lg mx-auto py-12 space-y-8">

        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Swords size={26} className="text-red-500" />
            Vantic VS
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Peer-to-peer social wagering. Create an event, share the code, and let the chain resolve it.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Load an Event</h2>
            <p className="text-xs text-gray-500 mt-1">Enter an event ID or code shared with you.</p>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="Event ID or code..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoad()}
              className="bg-black border-white/10 text-white placeholder:text-gray-600"
            />
            <Button
              onClick={handleLoad}
              disabled={!code.trim()}
              className="bg-red-600 hover:bg-red-500 shrink-0"
            >
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Create a VS Event</h2>
            <p className="text-xs text-gray-500 mt-1">
              Set the stakes, mode, and resolution threshold. Share the event ID with your opponent to start.
            </p>
          </div>
          <CreateEventModal />
        </div>

        {myEvents.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white uppercase tracking-widest">My Events</h2>
            <div className="space-y-2">
              {myEvents.slice(0, 8).map((e) => (
                <button
                  key={e.id}
                  onClick={() => router.push(`/app/vs/${e.id}`)}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{e.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">
                      {e.status} · {e.mode}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-gray-600 shrink-0 ml-3" />
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardClient>
  )
}
