"use client"
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { ChainIndicator, StatusBadge } from '@/components/ui/statusBadge'
import { cancelVsEvent, Confirmation, confirmVsEventOutcome, fetchEventById, joinVsEvent, Participant, vsEvents } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Avatar } from '@radix-ui/react-avatar'
import { ArrowLeft, Ban, CheckCircle2, Clock, ExternalLink, Share2, UserPlus, XCircle } from 'lucide-react'
import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import { truncateEmail } from '../../utils/truncate_email'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [event, setEvent] = useState<vsEvents | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [loadingEvent, setLoadingEvent] = useState(false)
  const [joining, setJoining] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [userEmail, setUserEmail] = useState<string>("")

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (stored) {
      try {
        setUserEmail(JSON.parse(stored)?.email ?? "")
      } catch {}
    }
  }, [])

  const token = () => localStorage.getItem("auth_token") || ""

  useEffect(() => {
    async function fetchEvent() {
      const t = localStorage.getItem("auth_token")
      if (!t) return
      setLoadingEvent(true)
      try {
        const res = await fetchEventById(t, id)
        setEvent(res.event)
        setError(null)
      } catch {
        setError("Failed to fetch event")
      } finally {
        setLoadingEvent(false)
      }
    }
    fetchEvent()
  }, [id])

  const myParticipant = event?.participants.find(p => p.user_email === userEmail) ?? null
  const hasJoined = myParticipant !== null
  const myConfirmation = myParticipant?.confirmation ?? null

  const confirmedCount = event ? event.participants.filter(
    p => p.confirmation === "YES" || p.confirmation === "NO"
  ).length : 0
  const progressPercent = event && event.participant_target > 0
    ? Math.round((confirmedCount / event.participant_target) * 100)
    : 0
  const yesCount = event ? event.participants.filter(p => p.confirmation === 'YES').length : 0
  const noCount = event ? event.participants.filter(p => p.confirmation === 'NO').length : 0

  const handleJoin = async () => {
    setJoining(true)
    try {
      await joinVsEvent(token(), id)
      toast.success("You joined the event!")
      const res = await fetchEventById(token(), id)
      setEvent(res.event)
    } catch {
      toast.error("Failed to join event. Please try again.")
    } finally {
      setJoining(false)
    }
  }

  const handleConfirm = async (val: Confirmation) => {
    setConfirming(true)
    try {
      await confirmVsEventOutcome(token(), id, val)
      toast.success("Your confirmation has been recorded!")
      const res = await fetchEventById(token(), id)
      setEvent(res.event)
    } catch {
      toast.error("Failed to record confirmation. Please try again.")
    } finally {
      setConfirming(false)
    }
  }

  const handleCancelEvent = async () => {
    try {
      await cancelVsEvent(token(), id)
      toast.success("The event has been cancelled.")
      const res = await fetchEventById(token(), id)
      setEvent(res.event)
    } catch {
      toast.error("Failed to cancel event. Please try again.")
    }
  }

  const currentUrl = typeof window !== "undefined"
    ? window.location.href
    : `https://vantic.xyz/app/vs/${id}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      toast.success("Link copied to clipboard!")
    } catch {
      toast.error("Failed to copy link")
    }
  }

  if (loadingEvent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="w-10 h-10 text-red-600" />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 p-8">Error: {error}</div>
  }

  if (!event) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-bold text-white mb-3">VS Event Not Found</h2>
          <p className="text-gray-400 mb-8 text-lg">
            We couldn't find any event with that ID.
          </p>
          <Link
            href="/app/vs"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-2xl transition-all active:scale-95"
          >
            <ArrowLeft size={16} />
            Back to VS
          </Link>
        </div>
      </div>
    )
  }

  const isActive = event.status === 'open' || event.status === 'active'
  const isCreator = event.creator_email === userEmail

  return (
    <DashboardClient>
      <div className="flex flex-col min-h-screen">
        <header className="border-b border-white/5 bg-background/50 backdrop-blur-xl">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/app/vs" className="flex items-center gap-2 group">
              <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-white transition-colors">VS Events</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="h-9 border-white/5 bg-secondary/50 font-bold text-[10px] uppercase tracking-widest" onClick={() => setShowShareModal(true)}>
                <Share2 className="w-3 h-3 mr-2" />
                Share
              </Button>
              {isCreator && isActive && (
                <Button variant="outline" size="sm" className="h-9 border-white/5 bg-secondary/50 font-bold text-[10px] cursor-pointer uppercase tracking-widest text-error hover:bg-error/10" onClick={handleCancelEvent}>
                  <Ban className="w-3 h-3 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={event.mode} />
                  <StatusBadge status={event.status} />
                  <ChainIndicator state={event.chain_state} />
                </div>
                <h1 className="text-4xl md:text-5xl font-headline font-black uppercase tracking-tighter leading-tight italic">
                  {event.title}
                </h1>
                <p className="text-muted-foreground font-medium">
                  {event.mode === 'mutual'
                    ? 'Mutual mode: all participants must agree on the same outcome to resolve.'
                    : `Consensus mode: ${event.threshold ?? 'a threshold of'} confirmations needed to resolve.`}
                </p>
              </div>

              <div className="glass-card rounded-2xl p-8 border-primary/20 space-y-8 neon-glow-primary">
                {!hasJoined && isActive && !isCreator ? (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Join Event</h3>
                      <p className="text-xs text-muted-foreground uppercase font-medium">
                        Join this VS event to participate and confirm the outcome.
                      </p>
                    </div>
                    <Button
                      onClick={handleJoin}
                      disabled={joining}
                      className="w-full h-14 bg-red-600 hover:bg-red-500 font-bold text-sm uppercase tracking-widest"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {joining ? 'Joining...' : 'Join Event'}
                    </Button>
                  </>
                ) : hasJoined && isActive ? (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Confirm Outcome</h3>
                      <p className="text-xs text-muted-foreground uppercase font-medium">
                        {myConfirmation
                          ? `You confirmed: ${myConfirmation}. You can change your vote.`
                          : 'Based on your observation, what is the final state of this event?'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <Button
                        onClick={() => handleConfirm('YES')}
                        disabled={confirming || myConfirmation === 'YES'}
                        className={cn(
                          "h-24 flex-col gap-2 rounded-xl border-2 transition-all group",
                          myConfirmation === 'YES'
                            ? "bg-success/20 border-success text-success scale-[1.02]"
                            : "bg-secondary/50 border-white/5 hover:border-success/50 hover:bg-success/5"
                        )}
                      >
                        <CheckCircle2 className={cn("w-8 h-8 transition-transform group-hover:scale-110",
                          myConfirmation === 'YES' ? "text-success" : "text-muted-foreground")}
                        />
                        <span className="font-headline font-black text-xl italic uppercase tracking-tighter">YES, IT HAPPENED</span>
                      </Button>

                      <Button
                        onClick={() => handleConfirm('NO')}
                        disabled={confirming || myConfirmation === 'NO'}
                        className={cn(
                          "h-24 flex-col gap-2 rounded-xl border-2 transition-all group",
                          myConfirmation === 'NO'
                            ? "bg-error/20 border-error text-error scale-[1.02]"
                            : "bg-secondary/50 border-white/5 hover:border-error/50 hover:bg-error/5"
                        )}
                      >
                        <XCircle className={cn("w-8 h-8 transition-transform group-hover:scale-110",
                          myConfirmation === 'NO' ? "text-error" : "text-muted-foreground")}
                        />
                        <span className="font-headline font-black text-xl italic uppercase tracking-tighter">NO, IT DIDN'T</span>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                    <p className="text-xl font-bold text-muted-foreground">
                      {event.status === 'resolved'
                        ? 'Event has been resolved'
                        : event.status === 'cancelled'
                        ? 'Event was cancelled'
                        : 'Event is no longer active'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {event.outcome ? `Outcome: ${event.outcome}` : 'No further action required.'}
                    </p>
                  </div>
                )}

                <div className="bg-background/50 rounded-xl p-4 flex items-center justify-between border border-white/5">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-accent animate-pulse-glow" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resolution Logic</p>
                      <p className="text-sm font-headline font-bold uppercase tracking-tight">
                        {isActive
                          ? event.mode === 'mutual'
                            ? 'All participants must confirm the same outcome.'
                            : `${event.threshold ?? '?'} out of ${event.participant_target} must agree.`
                          : 'This event has been finalized.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-headline text-2xl font-black uppercase tracking-tighter italic">
                  Participants ({event.participants.length}/{event.participant_target})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.participants.map((p: Participant) => (
                    <div
                      key={p.id}
                      className={cn(
                        "glass-card rounded-xl p-6 flex items-center justify-between border-l-4",
                        p.user_email === userEmail ? "border-primary/40" : "border-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{p.user_email[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold tracking-tight flex items-center gap-2">
                            {truncateEmail(p.user_email)}
                            {event.creator_email === p.user_email && (
                              <span className="text-[6px] px-1.5 py-0.5 bg-accent/20 text-accent rounded-full border border-accent/20 tracking-widest">CREATOR</span>
                            )}
                            {p.user_email === userEmail && (
                              <span className="text-[6px] px-1.5 py-0.5 bg-primary/20 text-primary rounded-full border border-primary/20 tracking-widest">YOU</span>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Participant</p>
                        </div>
                      </div>
                      <div className="text-right pl-5">
                        <StatusBadge status={p.confirmation || "pending"} className="text-[9px]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6 border-white/5 space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Confirmation Progress</p>
                  <div className="flex items-center justify-between">
                    <p className="font-headline font-bold text-lg">{progressPercent === 100 ? "COMPLETE" : "IN PROGRESS"}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">{yesCount + noCount}/{event.participant_target}</p>
                  </div>
                  <Progress value={progressPercent} className="h-2 bg-secondary" />
                  <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                    <span>YES: {yesCount}</span>
                    <span>NO: {noCount}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-widest">Mode</span>
                    <span className="font-bold uppercase tracking-tight text-white">{event.mode}</span>
                  </div>
                  {event.mode === 'consensus' && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium uppercase tracking-widest">Threshold</span>
                      <span className="font-bold uppercase tracking-tight text-white">{event.threshold ?? '-'}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-widest">Stake</span>
                    <span className="font-bold uppercase tracking-tight text-white">${event.stake_amount}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-widest">Network</span>
                    <span className="font-bold uppercase tracking-tight text-white">Solana</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-widest">ID</span>
                    <span className="font-mono text-[10px] text-white/50">{id.slice(0, 12)}...</span>
                  </div>
                </div>

                {event.creation_tx_hash && (
                  <Button
                    variant="outline"
                    className="w-full border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest"
                    onClick={() => window.open(`https://solscan.io/tx/${event.creation_tx_hash}`, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    View on Solscan
                  </Button>
                )}
              </div>

              <div className="bg-secondary/30 rounded-2xl p-6 border border-white/5">
                <h4 className="font-headline font-bold uppercase text-sm mb-4 tracking-tight">Trust & Safety</h4>
                <p className="text-[10px] leading-relaxed text-muted-foreground font-medium uppercase tracking-wide">
                  Vantic VS uses social consensus for resolution. If participants disagree, the event persists until threshold agreement is reached. Only wager with trusted parties for Mutual events.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-1">Share this event</h3>
              <p className="text-sm text-gray-400 mb-6">Anyone with this link can view and join the event.</p>
              <div className="bg-black/50 border border-white/10 rounded-2xl p-4 font-mono text-sm break-all mb-6">
                {currentUrl}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={copyToClipboard}
                  className="flex-1 bg-white text-black hover:bg-white/90 font-semibold"
                >
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowShareModal(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardClient>
  )
}
