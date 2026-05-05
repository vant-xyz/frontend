"use client"
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { ChainIndicator, StatusBadge } from '@/components/ui/statusBadge';
import { cancelVsEvent, Confirmation, confirmVsEventOutcome, fetchEventById, Participant, vsEvents } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Avatar } from '@radix-ui/react-avatar';

import { ArrowLeft, Ban, CheckCircle2, Clock, ExternalLink, Share2, XCircle } from 'lucide-react';
import Link from 'next/link';

import { use, useEffect, useState } from "react";   // ← Import this
import { truncateEmail } from '../../utils/truncate_email';
import { toast } from "sonner";
import { Progress } from '@/components/ui/progress';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<vsEvents | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const token = localStorage.getItem("auth_token") || "";
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  console.log("User from localStorage:", user);

  const confirmedCount = event ? event.participants.filter(
    p => p.confirmation === "YES" || p.confirmation === "NO"
  ).length : 0;
  const progress = event && event.participants.length > 0    ? (confirmedCount / event.participant_target) * 100
    : 0;
  const yesCount = event ? event.participants.filter(p => p.confirmation === 'YES').length : 0;
  const noCount = event ? event.participants.filter(p => p.confirmation === 'NO').length : 0;
  const total = event ? event.participant_target : 0;
  const progressPercent = Math.round(progress);
  const [userConfirmation, setUserConfirmation] = useState<Confirmation>("YES");

  console.log(progress, progressPercent, yesCount, noCount, total)

  const [loadingEvent, setLoadingEvent] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      try {
        setLoadingEvent(true);
        const token = localStorage.getItem("auth_token");
        if (!token) {
          console.error("No auth token found");
          return;
        }
        const res = await fetchEventById(token, id);
        setEvent(res.event);
        setError(null);
        setLoadingEvent(false);
      } catch (error) {
        console.error("Error fetching event:", error);
        setError("Failed to fetch event");
        setLoadingEvent(false);
      }
    }

    fetchEvent();
  }, [id]);

  const handleConfirm = async (val: Confirmation) => {
    setUserConfirmation(val);
    console.log(val)
    try {
      const res = await confirmVsEventOutcome(token, id, val);
      toast.success("Your confirmation has been recorded!");
      const updatedEvent = await fetchEventById(token, id);
      setEvent(updatedEvent.event);
    } catch (error) {
      toast.error("There was an error confirming your outcome. Please try again.");
    }
  };

  const handleCancelEvent = async () => {
    // Implement event cancellation logic here
    try {

      const res = await cancelVsEvent(token, id);
      toast.success("The event has been cancelled.");
      // const updatedEvent = await fetchEventById(token, id);
      // setEvent(updatedEvent.event);
    } catch (error) {
      console.log(error);
      toast.error("There was an error cancelling the event. Please try again.");
    }
  }

  const handleShareLink = () => {
    setShowShareModal(true);
  };

  const currentUrl = typeof window !== "undefined"
    ? window.location.href
    : `https://vantic.xyz/app/vs/${id}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  console.log(event)



  if (loadingEvent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="w-10 h-10 text-red-600" />
      </div>
    );
  }
  if (error) {
    return <div className="text-red-500 p-8">Error: {error}</div>;
  }

  if (!event) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
            <span className="text-5xl">🤔</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-3">VS Event Not Found</h2>
          <p className="text-gray-400 mb-8 text-lg">
            We couldn't find any event with that ID.
          </p>

          <Link
            href="/app/vs"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-2xl transition-all active:scale-95"
          >
            ← Return to Events
          </Link>
        </div>
      </div>
    );
  }


  return (
    <DashboardClient>
      <div className="flex flex-col min-h-screen">
        <header className="border-b border-white/5 bg-background/50 backdrop-blur-xl">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-white transition-colors">Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="h-9 border-white/5 bg-secondary/50 font-bold text-[10px] uppercase tracking-widest" onClick={handleShareLink}>
                <Share2 className="w-3 h-3 mr-2" />
                Share Link
              </Button>
              {event.creator_email === user.email && event.status === 'open' && (
                <Button variant="outline" size="sm" className="h-9 border-white/5 bg-secondary/50 font-bold text-[10px] cursor-pointer uppercase tracking-widest text-error hover:bg-error/10" onClick={handleCancelEvent}>
                  <Ban className="w-3 h-3 mr-2" />
                  Cancel Event
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
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
                  This event is currently <span className="text-white">Active</span>. Participants are required to confirm the final outcome manually to resolve the wager.
                </p>
              </div>

              {/* Participation Section */}
              <div className="glass-card rounded-2xl p-8 border-primary/20 space-y-8 neon-glow-primary">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Confirm Outcome</h3>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Based on your observation, what is the final state of this event?</p>
                </div>

                {event.status === 'open' || event.status === 'active' ? (
                  <div className="grid grid-cols-2 gap-6">
                    <Button
                      onClick={() => handleConfirm('YES')}
                      disabled={userConfirmation === 'YES'}
                      className={cn(
                        "h-24 flex-col gap-2 rounded-xl border-2 transition-all group",
                        userConfirmation === 'YES'
                          ? "bg-success/20 border-success text-success scale-[1.02]"
                          : "bg-secondary/50 border-white/5 hover:border-success/50 hover:bg-success/5"
                      )}
                    >
                      <CheckCircle2 className={cn("w-8 h-8 transition-transform group-hover:scale-110",
                        userConfirmation === 'YES' ? "text-success" : "text-muted-foreground")}
                      />
                      <span className="font-headline font-black text-xl italic uppercase tracking-tighter">YES, IT HAPPENED</span>
                    </Button>

                    <Button
                      onClick={() => handleConfirm('NO')}
                      disabled={userConfirmation === 'NO'}
                      className={cn(
                        "h-24 flex-col gap-2 rounded-xl border-2 transition-all group",
                        userConfirmation === 'NO'
                          ? "bg-error/20 border-error text-error scale-[1.02]"
                          : "bg-secondary/50 border-white/5 hover:border-error/50 hover:bg-error/5"
                      )}
                    >
                      <XCircle className={cn("w-8 h-8 transition-transform group-hover:scale-110",
                        userConfirmation === 'NO' ? "text-error" : "text-muted-foreground")}
                      />
                      <span className="font-headline font-black text-xl italic uppercase tracking-tighter">NO, IT DIDN'T</span>
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                    <p className="text-xl font-bold text-muted-foreground">
                      {event.status === 'resolved' ? '✅ Event has been resolved' :
                        event.status === 'cancelled' ? '🚫 Event was cancelled' :
                          'Event is no longer active'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      You can no longer vote on this event.
                    </p>
                  </div>
                )}

                <div className="bg-background/50 rounded-xl p-4 flex items-center justify-between border border-white/5">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-accent animate-pulse-glow" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resolution Logic</p>
                      <p className="text-sm font-headline font-bold uppercase tracking-tight">
                        {event.status === 'open' || event.status === 'active'
                          ? "Waiting for all participants to confirm outcome."
                          : "This event has been finalized."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Participants Detailed List */}
              <div className="space-y-6">
                <h3 className="font-headline text-2xl font-black uppercase tracking-tighter italic">Participants</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.participants.map((p: Participant) => (
                    <div key={p.id} className="glass-card rounded-xl p-6 flex items-center justify-between border-white/5 border-l-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ">
                          {/* <AvatarImage src={p.avatar} /> */}
                          <AvatarFallback>{p.user_email[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold tracking-tight flex items-center gap-2">
                            {truncateEmail(p.user_email)}
                            {(event.creator_email === p.user_email) && <span className="text-[6px] px-1.5 py-0.5 bg-accent/20 text-accent rounded-full border border-accent/20 tracking-widest">CREATOR</span>}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Participant</p>
                        </div>
                      </div>
                      <div className="text-right pl-5">
                        <StatusBadge status={p.confirmation || "completed"} className="text-[9px]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6 border-white/5 space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Verification State</p>
                  <div className="flex items-center justify-between">
                    <p className="font-headline font-bold text-lg">{progressPercent === 100 ? "VERIFIED" : "IN PROGRESS"}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">{yesCount + noCount}/{total}</p>
                  </div>
                  <Progress value={progressPercent} className="h-2 bg-secondary" />
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-widest">Resolution Mode</span>
                    <span className="font-bold uppercase tracking-tight text-white">{event.mode}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-widest">Network</span>
                    <span className="font-bold uppercase tracking-tight text-white">Solana Mainnet</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-widest">ID</span>
                    <span className="font-mono text-[10px] text-white/50">{event.id.padEnd(12, '0').slice(0, 12)}...</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest" onClick={() =>
                  window.location.href = `https://solscan.io/tx/${event.creation_tx_hash}`
                }>
                  <ExternalLink className="w-3 h-3 mr-2" />
                  View On Solana Explorer
                </Button>
              </div>

              <div className="bg-secondary/30 rounded-2xl p-6 border border-white/5">
                <h4 className="font-headline font-bold uppercase text-sm mb-4 tracking-tight">Trust & Safety</h4>
                <p className="text-[10px] leading-relaxed text-muted-foreground font-medium uppercase tracking-wide">
                  Vantic VS uses social consensus for resolution. If participants disagree, the event enters an arbitration phase or persists until threshold agreement is reached. Ensure you only wager with trusted parties for Mutual events.
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
              <p className="text-sm text-gray-400 mb-6">Anyone with this link can view and join the event</p>

              <div className="bg-black/50 border border-white/10 rounded-2xl p-4 font-mono text-sm break-all mb-6">
                {currentUrl}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={copyToClipboard}
                  className="flex-1 bg-white text-black hover:bg-white/90 font-semibold"
                >
                  📋 Copy Link
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
