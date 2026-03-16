"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => {
        setEmail("");
        setSubmitted(false);
        onClose();
      }, 2500);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black border border-red-900/50 sm:rounded-xl">
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-white">Join VANT</DialogTitle>
              <DialogDescription className="text-gray-400 leading-relaxed">
                Be the first to access the fastest prediction terminal for West Africa. Early access coming soon.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 focus:ring-1 focus:ring-red-600"
              />
              <Button
                type="submit"
                disabled={!email}
                className="w-full bg-red-600 text-white font-semibold hover:bg-red-500"
              >
                Join Waitlist
              </Button>
            </form>

            <DialogFooter className="sm:justify-center">
              <p className="text-xs text-gray-500 text-center">
                We'll notify you when early access opens.
              </p>
            </DialogFooter>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="mb-6 flex justify-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Confirmed!</h3>
            <p className="text-gray-400 text-sm">
              Check your inbox for updates about VANT.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
