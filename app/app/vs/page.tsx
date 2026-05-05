"use client"

import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { Button } from "@/components/ui/button";
import { CreateEventModal } from "@/components/ui/createEventModal";
import { EventCard } from "@/components/ui/EventCard";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { getVsEvents, vsEvents } from "@/lib/api";
import { LayoutGrid, ListIcon, Search, SlidersHorizontal } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react"

export default function page() {

    const [search, setSearch] = useState("");
    const [token, setToken] = useState<string | null>(null);
    const [events, setEvents] = useState<vsEvents[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);   // Only for first load

    // Get token
    useEffect(() => {
        const storedToken = localStorage.getItem("auth_token");
        setToken(storedToken);
    }, []);

    const fetchEvents = useCallback(async () => {
        if (!token) return;

        try {
            const res = await getVsEvents(token);
            setEvents(res.events || []);
        } catch (error) {
            console.error("Error fetching events:", error);
            setEvents([]);
        }
    }, [token]);

    // Initial fetch + Polling
    useEffect(() => {
        if (!token) return;

        // Initial load
        const loadInitial = async () => {
            await fetchEvents();
            setIsInitialLoading(false);
        };

        loadInitial();

        // Polling (no loading state)
        const interval = setInterval(fetchEvents, 3000);

        return () => clearInterval(interval);
    }, [token, fetchEvents]);

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase())
    );
    return (
        <DashboardClient>
            <div className="flex flex-col min-h-screen">

                <main className="flex-1 container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-headline font-black uppercase tracking-tighter italic">EVENT DASHBOARD</h2>
                            <p className="text-muted-foreground max-w-lg">Peer-to-peer social wagering on the Solana blockchain. Real stakes, social resolution, lightning fast.</p>
                        </div>
                        <CreateEventModal />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search active events..."
                                className="pl-10 h-11 bg-secondary border-white/5 focus:ring-primary/20"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-11 w-11 border-white/5 bg-secondary/50">
                                <SlidersHorizontal className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center bg-secondary/50 rounded-md p-1 border border-white/5">
                                <Button variant="ghost" size="icon" className="h-9 w-9 bg-background shadow-sm border border-white/10 text-primary">
                                    <LayoutGrid className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                                    <ListIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isInitialLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader className="w-8 h-8 text-red-600" />
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        /* Empty State - Inside Dashboard */
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                <Search className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-headline text-xl">No Events Found</h3>
                                <p className="text-muted-foreground">Check back later for new events or create one yourself.</p>
                            </div>
                            <CreateEventModal />
                        </div>
                    ) : (
                        /* Events Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredEvents.map((event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="border-t border-white/5 py-8 mt-auto">
                    <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-medium uppercase tracking-widest">
                        <p>© 2024 Vantic Protocol. All rights reserved.</p>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                            <a href="#" className="hover:text-primary transition-colors">Terms</a>
                            <a href="#" className="hover:text-primary transition-colors">Discord</a>
                            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
                        </div>
                    </div>
                </footer>
            </div>
        </DashboardClient>
    )
}