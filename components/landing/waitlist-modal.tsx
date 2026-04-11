"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { joinWaitlist } from "@/lib/api";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultReferralCode?: string;
}

export function WaitlistModal({ isOpen, onClose, defaultReferralCode }: WaitlistModalProps) {
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showReferral, setShowReferral] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultReferralCode) {
      setReferralCode(defaultReferralCode);
      setShowReferral(true);
    }
  }, [defaultReferralCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await joinWaitlist({
        email,
        referralCode: referralCode || undefined,
      });
      setResponseMessage(res.message);
      setSubmitted(true);
      setTimeout(() => {
        setEmail("");
        setReferralCode("");
        setSubmitted(false);
        onClose();
      }, 3500);
    } catch (err) {
      setError("Failed to join waitlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Desktop Modal */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4">
        <div className="bg-black border border-gray-800 rounded-xl p-8 max-w-md w-full relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {!submitted ? (
            <>
              <div className="mb-6">
                <img
                  src="/media/images/waitlist_media.jpg"
                  alt="Vantic waitlist"
                  loading="lazy"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>

              <h2 className="text-3xl font-bold text-white mb-3">Join Vantic</h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Be the first to access the fastest prediction terminal on Solana. Early access coming soon.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-black border-gray-800 text-white placeholder-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />

                {/* Referral Toggle */}
                <button
                  type="button"
                  onClick={() => setShowReferral(!showReferral)}
                  className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className={`w-4 h-4 transition-transform ${showReferral ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {showReferral ? "Hide referral code" : "Have a referral code?"}
                </button>

                {/* Referral OTP Input */}
                {showReferral && (
                  <div className="flex justify-center py-2">
                    <InputOTP
                      maxLength={6}
                      value={referralCode}
                      onChange={(value) => setReferralCode(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={!email || loading}
                  className="w-full bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50 h-10 flex items-center justify-center"
                >
                  {loading ? <Loader /> : "Join Waitlist"}
                </Button>
              </form>

              <p className="text-xs text-gray-500 mt-6 text-center">
                We'll notify you when early access opens.
              </p>
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
              <h3 className="text-2xl font-bold text-white mb-2">
                {responseMessage.includes("already") ? "Welcome Back!" : "Confirmed!"}
              </h3>
              <p className="text-gray-400 text-sm">
                {responseMessage}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-black rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex justify-between items-center">
          <div />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {!submitted ? (
          <>
            <div className="mb-6">
              <img
                src="/media/images/waitlist_media.jpg"
                alt="Vantic waitlist"
                loading="lazy"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">Join Vantic</h2>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Be the first to access the fastest prediction terminal for West Africa.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-black border-gray-800 text-white placeholder-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />

              {/* Referral Toggle */}
              <button
                type="button"
                onClick={() => setShowReferral(!showReferral)}
                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className={`w-4 h-4 transition-transform ${showReferral ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {showReferral ? "Hide referral code" : "Have a referral code?"}
              </button>

              {/* Referral OTP Input */}
              {showReferral && (
                <div className="flex justify-center py-2">
                  <InputOTP
                    maxLength={6}
                    value={referralCode}
                    onChange={(value) => setReferralCode(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Button
                type="submit"
                disabled={!email || loading}
                className="w-full bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50 h-10 flex items-center justify-center"
              >
                {loading ? <Loader /> : "Join Waitlist"}
              </Button>
            </form>

            <p className="text-xs text-gray-500 mt-6 text-center">
              We'll notify you when early access opens.
            </p>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="mb-4 flex justify-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {responseMessage.includes("already") ? "Welcome Back!" : "Confirmed!"}
            </h3>
            <p className="text-gray-400 text-sm">
              {responseMessage}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
