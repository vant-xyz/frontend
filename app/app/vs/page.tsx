"use client"

import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { Button } from "@/components/ui/button"
import { CreateEventModal } from "@/components/ui/createEventModal"
import { Input } from "@/components/ui/input"
import { getMyCreatedVsEvents, getMyJoinedVsEvents, vsEvents } from "@/lib/api"
import { ArrowRight, Plus, Swords } from "lucide-react"
import React, { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/statusBadge"

type MyTab = "created" | "joined"

function EventCard({ event, onClick }: { event: vsEvents; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 glass-card hover:bg-white/8 border border-white/5 rounded-xl transition-colors text-left group"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">{event.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <StatusBadge status={event.status} />
          <span className="text-[10px] text-gray-600 uppercase tracking-wide">{event.mode}</span>
        </div>
      </div>
      <ArrowRight size={14} className="text-gray-600 group-hover:text-white shrink-0 ml-3 transition-colors" />
    </button>
  )
}

export default function VSPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [activeTab, setActiveTab] = useState<MyTab>("created")
  const [createdEvents, setCreatedEvents] = useState<vsEvents[]>([])
  const [joinedEvents, setJoinedEvents] = useState<vsEvents[]>([])
  const [loadingCreated, setLoadingCreated] = useState(true)
  const [loadingJoined, setLoadingJoined] = useState(true)

  const loadCreated = useCallback(async () => {
    const token = localStorage.getItem("auth_token")
    if (!token) return
    setLoadingCreated(true)
    try {
      const res = await getMyCreatedVsEvents(token)
      setCreatedEvents(res.events ?? [])
    } catch {
      setCreatedEvents([])
    } finally {
      setLoadingCreated(false)
    }
  }, [])

  const loadJoined = useCallback(async () => {
    const token = localStorage.getItem("auth_token")
    if (!token) return
    setLoadingJoined(true)
    try {
      const res = await getMyJoinedVsEvents(token)
      setJoinedEvents(res.events ?? [])
    } catch {
      setJoinedEvents([])
    } finally {
      setLoadingJoined(false)
    }
  }, [])

  useEffect(() => { loadCreated() }, [loadCreated])

  useEffect(() => {
    if (activeTab === "joined" && loadingJoined && joinedEvents.length === 0) {
      loadJoined()
    }
  }, [activeTab, loadingJoined, joinedEvents.length, loadJoined])

  const handleLoad = () => {
    const trimmed = code.trim()
    if (!trimmed) return
    router.push(`/app/vs/${trimmed}`)
  }

  const activeEvents = activeTab === "created" ? createdEvents : joinedEvents
  const isLoading = activeTab === "created" ? loadingCreated : loadingJoined

  return (
    <DashboardClient>
      <div className="space-y-8 pb-20">

        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Swords size={26} className="text-red-500" />
            Vantic VS
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Peer-to-peer social wagering. Create a challenge, share the code, let the chain resolve it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card border border-white/5 rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Join an Event</h2>
              <p className="text-xs text-gray-500 mt-1">Enter an event ID shared with you.</p>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="Paste event ID..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLoad()}
                className="bg-black/40 border-white/10 text-white placeholder:text-gray-600"
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

          <div className="glass-card border border-white/5 rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Create a Challenge</h2>
              <p className="text-xs text-gray-500 mt-1">Set the stakes, mode, and share the ID with your opponent.</p>
            </div>
            <CreateEventModal onSuccess={loadCreated} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {(["created", "joined"] as MyTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-2 text-sm font-semibold rounded-lg transition-colors capitalize",
                  activeTab === tab
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {tab === "created" ? "My Events" : "Joined"}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-xl" />
              ))}
            </div>
          ) : activeEvents.length === 0 ? (
            <div className="glass-card border border-white/5 rounded-2xl p-12 text-center">
              <Swords size={32} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">
                {activeTab === "created" ? "No challenges created yet." : "You haven't joined any challenges yet."}
              </p>
              {activeTab === "created" && (
                <p className="text-gray-600 text-xs mt-1">Create one above and share the ID with your opponent.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {activeEvents.slice(0, 10).map((e) => (
                <EventCard key={e.id} event={e} onClick={() => router.push(`/app/vs/${e.id}`)} />
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardClient>
  )
}
