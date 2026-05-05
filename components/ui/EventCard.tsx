
"use client";

import Link from "next/link";

import { StatusBadge, ChainIndicator } from "@/components/ui/statusBadge";
import { Users, ChevronRight } from "lucide-react";
import { vsEvents } from "@/lib/api";

interface EventCardProps {
  event: vsEvents;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Link href={`/app/vs/${event.id}`}>
      <div className="group relative overflow-hidden glass-card rounded-xl p-5 transition-all hover:bg-white/[0.03] hover:border-white/10">
        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div className="flex flex-col gap-4 ">
          <div className="flex justify-between items-start gap-4">
            <h3 className="font-headline text-lg leading-tight group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <StatusBadge status={event.status} />
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{event?.participants?.length || 1} Participants</span>
            </div>
            <StatusBadge status={event.mode} />
          </div>

          <div className="pt-2 border-t border-white/5 flex justify-between items-center">
             <ChainIndicator state={event.chain_state} />
             <span className="text-[10px] text-muted-foreground/50">Created {new Date(event.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
