"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Info, Calendar } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Textarea } from "./textarea";
import { createVsEvent } from "@/lib/api";
import { useDashboard } from "@/hooks/use-dashboard";

interface CreateEventModalProps {
    onSuccess?: () => void;
}

export function CreateEventModal({ onSuccess }: CreateEventModalProps) {
    const [mode, setMode] = useState<"mutual" | "consensus">("mutual");
    const [threshold, setThreshold] = useState(66);
    const [question, setQuestion] = useState("");
    const [description, setDescription] = useState("");
    const [open, setOpen] = useState(false);
    const [stake, setStake] = useState(0);
    const [participantTarget, setParticipantTarget] = useState(2);
    const [joinDeadline, setJoinDeadline] = useState("");
    const [resolutionDeadline, setResolutionDeadline] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { isDemoMode } = useDashboard();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        if (!token) return;
        if (!question.trim() || !joinDeadline || !resolutionDeadline) {
            toast.error("Please fill all required fields.");
            return;
        }
        if (stake <= 0) {
            toast.error("Stake must be greater than 0.");
            return;
        }
        if (participantTarget < 2) {
            toast.error("Participant target must be at least 2.");
            return;
        }
        if (mode === "mutual" && participantTarget !== 2) {
            toast.error("Mutual mode requires exactly 2 participants.");
            return;
        }

        const joinTs = Math.floor(new Date(joinDeadline).getTime() / 1000);
        const resolutionTs = Math.floor(new Date(resolutionDeadline).getTime() / 1000);
        const absThreshold = mode === "consensus"
            ? Math.ceil((threshold / 100) * participantTarget)
            : 0;

        const newEvent = {
            title: question,
            description,
            mode,
            threshold: absThreshold,
            participant_target: participantTarget,
            stake_amount: stake,
            join_deadline_utc: joinTs,
            resolve_deadline_utc: resolutionTs,
            is_demo: isDemoMode,
        };

        try {
            setIsSubmitting(true);
            await createVsEvent(token, newEvent);
            toast.success("Event created successfully!");
            setOpen(false);
            onSuccess?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create event.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="font-headline font-bold neon-glow-primary hover:bg-primary/90 ">
                    <Plus className="w-4 h-4 mr-2" />
                    CREATE EVENT
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] bg-background border-white/10 p-0 overflow-hidden w-[calc(100%-32px)] left-[50%] translate-x-[-50%]">
                <div className="bg-primary/10 p-3 border-b border-primary/20">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-xl uppercase tracking-tighter">New VS Challenge</DialogTitle>
                    </DialogHeader>
                </div>


                <div className=" p-2 space-y-6 overflow-y-auto max-h-[68vh] scrollbar-hide">
                    <form onSubmit={handleSubmit} className="p-4 space-y-5">
                        <div className="space-y-3">
                            <Label htmlFor="question" className="text-xs uppercase font-bold text-muted-foreground">Event Question</Label>
                            <Input
                                id="question"
                                placeholder="e.g. I'll beat you in our next 1v1"
                                className="bg-secondary border-white/5 focus:border-primary focus:ring-primary/20 h-12"
                                required
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="description" className="text-xs uppercase font-bold  text-muted-foreground">Event Description</Label>
                            <Textarea
                                id="description"
                                placeholder="What are the terms? What counts as winning?"
                                className="bg-secondary border-white/5 focus:border-primary focus:ring-primary/20 h-12 w-full"
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1 grid grid-cols-2 gap-2">
                            <div className="w-full space-y-2">
                                <Label htmlFor="stake" className="text-xs uppercase font-bold text-muted-foreground">Event Stake</Label>
                                <Input
                                    id="stake"
                                    placeholder="e.g. 10"
                                    className="bg-secondary border-white/5 focus:border-primary focus:ring-primary/20 h-12"
                                    required
                                    value={stake}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setStake(value === '' ? 0 : Number(value));   // Safe handling
                                    }}
                                />
                            </div>

                            <div className="w-full space-y-2">
                                <Label htmlFor="participantTarget" className="text-xs uppercase font-bold text-muted-foreground">Participant Target</Label>
                                <Input
                                    id="participantTarget"
                                    placeholder="e.g. 2"
                                    className="bg-secondary border-white/5 focus:border-primary focus:ring-primary/20 h-12"
                                    required
                                    value={participantTarget}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setParticipantTarget(value === '' ? 0 : Number(value));   // Safe handling
                                    }}
                                />
                            </div>
                        
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="w-full">
                                <Label htmlFor="joinDeadline" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                                    {/* <Calendar className="w-3.5 h-3.5" />  */}
                                    
                                    Join Deadline
                                </Label>
                                <Input
                                    id="joinDeadline"
                                    type="datetime-local"
                                    className="bg-secondary border-white/5 focus:border-primary h-12 mt-1.5"
                                    value={joinDeadline}
                                    onChange={(e) => setJoinDeadline(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="w-full">
                                <Label htmlFor="resolutionDeadline" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                                    {/* <Calendar className="w-3.5 h-3.5" />  */}
                                    Resolution Deadline
                                </Label>
                                <Input
                                    id="resolutionDeadline"
                                    type="datetime-local"
                                    className="bg-secondary border-white/5 focus:border-primary h-12 mt-1.5"
                                    value={resolutionDeadline}
                                   onChange={(e) => setResolutionDeadline(e.target.value)}
                                    required
                                />
                            </div>

                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs uppercase font-bold text-muted-foreground">Wager Mode</Label>
                            <RadioGroup defaultValue="mutual" onValueChange={(v) => { setMode(v as any); if (v === "mutual") setParticipantTarget(2); }} className="grid grid-cols-2 gap-4">
                                <div>
                                    <RadioGroupItem value="mutual" id="mutual" className="peer sr-only" />
                                    <Label
                                        htmlFor="mutual"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <span className="font-headline font-bold">MUTUAL</span>
                                        <span className="text-[10px] text-muted-foreground mt-1">1v1 Agreement</span>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="consensus" id="consensus" className="peer sr-only" />
                                    <Label
                                        htmlFor="consensus"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <span className="font-headline font-bold">CONSENSUS</span>
                                        <span className="text-[10px] text-muted-foreground mt-1">Group Threshold</span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {mode === "consensus" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Resolution Threshold</Label>
                                    <span className="font-headline font-bold text-primary text-xl">
                                        {threshold}% · {Math.ceil((threshold / 100) * participantTarget)}/{participantTarget} must agree
                                    </span>
                                </div>
                                <Slider
                                    value={[threshold]}
                                    max={100}
                                    min={60}
                                    step={1}
                                    onValueChange={(v) => setThreshold(v[0])}
                                />
                                <div className="flex items-start gap-2 bg-white/5 p-3 rounded-md border border-white/5">
                                    <Info className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                                    <p className="text-[10px] leading-normal text-muted-foreground">
                                        The event resolves when {Math.ceil((threshold / 100) * participantTarget)} out of {participantTarget} participants agree on the outcome. YES = creator&apos;s claim was correct. NO = it wasn&apos;t.
                                    </p>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="pt-2">
                            <Button disabled={isSubmitting} type="submit" className="w-full h-12 font-headline font-bold text-lg bg-primary hover:bg-primary/90 neon-glow-primary" onClick={handleSubmit}>
                                {isSubmitting ? "Creating..." : "CREATE"}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
