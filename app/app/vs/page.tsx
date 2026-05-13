"use client"

import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { Button } from "@/components/ui/button"
import { CreateEventModal } from "@/components/ui/createEventModal"
import { Input } from "@/components/ui/input"
import { getMyCreatedVsEvents, getMyJoinedVsEvents, vsEvents } from "@/lib/api"
import { ArrowRight, Swords } from "lucide-react"
import React, { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

type MyTab = "created" | "joined"

function EventCard({ event, onClick }: { event: vsEvents; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-left"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-white truncate">{event.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">
          {event.status} · {event.mode}
        </p>
      </div>
      <ArrowRight size={14} className="text-gray-600 shrink-0 ml-3" />
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

        <div className="space-y-4">
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {(["created", "joined"] as MyTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize",
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
            <p className="text-gray-500 text-sm text-center py-8">
              {activeTab === "created" ? "You haven't created any events yet." : "You haven't joined any events yet."}
            </p>
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
