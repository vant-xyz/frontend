"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import {
  checkEmailExists,
  checkUsernameExists,
  login,
  signup,
  setUsername,
  type AuthResponse,
} from "@/lib/api";
import { validatePassword } from "@/lib/utils";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: AuthResponse["user"], token: string) => void;
}

type AuthStep = "email" | "password" | "signup-password" | "username" | "success";

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsernameState] = useState("");
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Password validation state
  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Real-time username validation
  useEffect(() => {
    const cleanUsername = username.replace("@", "").trim();
    
    if (cleanUsername.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const result = await checkUsernameExists(`@${cleanUsername}`);
        setUsernameAvailable(!result.exists);
        if (result.exists) {
          toast.error("Username is already taken");
        }
      } catch (err) {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("email");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setUsernameState("");
        setAuthToken("");
        setIsLogin(false);
        setUsernameAvailable(null);
        setCheckingUsername(false);
      }, 300);
    }
  }, [isOpen]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await checkEmailExists(email);
      if (result.exists) {
        setIsLogin(true);
        setStep("password");
      } else {
        setIsLogin(false);
        setStep("signup-password");
      }
    } catch (err) {
      toast.error("Failed to check email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      setAuthToken(result.token);
      setStep("success");
      onAuthSuccess?.(result.user, result.token);

      // Store token in localStorage and cookies for middleware
      localStorage.setItem("auth_token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      document.cookie = `auth_token=${result.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      toast.success("Welcome back!");
      setTimeout(() => {
        onClose();
        window.location.href = "/app";
      }, 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordValidation.isValid) {
      toast.error("Password does not meet requirements");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const result = await signup(email, password);
      setAuthToken(result.token);
      setStep("username");
      
      // Temporarily store token for username step
      localStorage.setItem("auth_token_temp", result.token);
      
      toast.success("Account created! Now choose your username");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to signup");
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUsername = username.replace("@", "").trim();
    
    if (cleanUsername.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (usernameAvailable === false) {
      toast.error("Username is already taken");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token_temp");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const result = await setUsername(`@${cleanUsername}`, email, token);
      
      // Update stored user data and set cookie
      const user = {
        vant_id: result.user.vant_id,
        email: result.user.email,
        username: result.user.username,
        balance_id: result.user.balance_id,
      };
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("auth_token", token);
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      localStorage.removeItem("auth_token_temp");

      setAuthToken(token);
      setStep("success");
      onAuthSuccess?.(user, token);

      toast.success("Username set successfully!");
      setTimeout(() => {
        onClose();
        window.location.href = "/app";
      }, 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set username");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderStepIndicator = () => {
    const steps = ["email", "password", "signup-password", "username", "success"];
    const currentIndex = steps.indexOf(step);
    
    return (
      <div className="flex gap-2 justify-center mb-6">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-1 rounded-full transition-all duration-300 ${
              i <= currentIndex ? "w-8 bg-red-600" : "w-4 bg-gray-800"
            }`}
          />
        ))}
      </div>
    );
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

          {renderStepIndicator()}

          {/* Email Step */}
          {step === "email" && (
            <>
              <div className="mb-6">
                <img
                  src="/media/images/authenticate_media.jpg"
                  alt="VANT authenticate"
                  loading="lazy"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>

              <h2 className="text-3xl font-bold text-white mb-3">Welcome to VANT</h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Enter your email to continue
              </p>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-black border-gray-800 text-white placeholder-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />

                <Button
                  type="submit"
                  disabled={!email || loading}
                  className="w-full bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50 h-10 flex items-center justify-center"
                >
                  {loading ? <Loader /> : "Continue"}
                </Button>
              </form>
            </>
          )}

          {/* Login Password Step */}
          {step === "password" && (
            <>
              <h2 className="text-3xl font-bold text-white mb-3">Welcome Back</h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Enter your password to login
              </p>

              <form onSubmit={handleLoginPasswordSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-black border-gray-800 text-white placeholder-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />

                <Button
                  type="submit"
                  disabled={!password || loading}
                  className="w-full bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50 h-10 flex items-center justify-center"
                >
                  {loading ? <Loader /> : "Login"}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-sm text-gray-400 hover:text-white transition-colors w-full text-center"
                >
                  ← Use a different email
                </button>
              </form>
            </>
          )}

          {/* Signup Password Step */}
          {step === "signup-password" && (
            <>
              <h2 className="text-3xl font-bold text-white mb-3">Create Account</h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Set up your password
              </p>

              <form onSubmit={handleSignupPasswordSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-black border-gray-800 text-white placeholder-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />

                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-black border-gray-800 text-white placeholder-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />

                {/* Password requirements */}
                <div className="space-y-2 text-xs">
                  <p className="text-gray-500 font-semibold mb-2">Password must have:</p>
                  {[
                    { label: "8+ characters", valid: password.length >= 8 },
                    { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
                    { label: "Lowercase letter", valid: /[a-z]/.test(password) },
                    { label: "Number", valid: /[0-9]/.test(password) },
                    { label: "Special character", valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
                  ].map((req) => (
                    <div key={req.label} className="flex items-center gap-2">
                      <svg
                        className={`w-3 h-3 ${req.valid ? "text-green-500" : "text-gray-600"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className={req.valid ? "text-green-500" : "text-gray-500"}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={!passwordValidation.isValid || !passwordsMatch || loading}
                  className="w-full bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50 h-10 flex items-center justify-center"
                >
                  {loading ? <Loader /> : "Continue"}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-sm text-gray-400 hover:text-white transition-colors w-full text-center"
                >
                  ← Use a different email
                </button>
              </form>
            </>
          )}

          {/* Username Step */}
          {step === "username" && (
            <>
              <h2 className="text-3xl font-bold text-white mb-3">Choose Username</h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Pick a unique username for your profile
              </p>

              <form onSubmit={handleUsernameSubmit} className="space-y-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                  <Input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsernameState(e.target.value)}
                    required
                    className={`bg-black border-gray-800 text-white placeholder-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 pl-8 pr-10 ${
                      usernameAvailable === true ? "border-green-500/50" : ""
                    } ${
                      usernameAvailable === false ? "border-red-500/50" : ""
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingUsername && (
                      <Loader className="w-4 h-4 text-gray-400" />
                    )}
                    {usernameAvailable === true && (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {usernameAvailable === false && (
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={username.length < 3 || usernameAvailable === false || checkingUsername || loading}
                  className="w-full bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50 h-10 flex items-center justify-center"
                >
                  {loading ? <Loader /> : "Complete Setup"}
                </Button>
              </form>
            </>
          )}

          {/* Success Step */}
          {step === "success" && (
            <div className="text-center py-8">
              <div className="mb-6 flex justify-center">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                  <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {isLogin ? "Welcome Back!" : "Account Created!"}
              </h3>
              <p className="text-gray-400 text-sm">
                {isLogin ? "You have successfully logged in" : "Your account has been created successfully"}
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

        {renderStepIndicator()}

        {/* Email Step */}
        {step === "email" && (
          <>
            <div className="mb-6">
              <img
                src="/media/images/authenticate_media.jpg"
                alt="VANT authenticate"
                loading="lazy"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">Welcome to VANT</h2>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Enter your email to continue
            </p>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-black border-gray-800 text-white placeholder-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />

              <Button
                type="submit"
                disabled={!email || loading}
                className="w-full bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50 h-10 flex items-center justify-center"
              >
                {loading ? <Loader /> : "Continue"}
              </Button>
            </form>
          </>
        )}

        {/* Login Password Step */}
        {step === "password" && (
          <>
            <h2 className="text-2xl font-bold text-white mb-3">Welcome Back</h2>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Enter your password to login
            </p>

            <form onSubmit={handleLoginPasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-black border-gray-800 text-white placeholder-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />

              <Button
                type="submit"
                disabled={!password || loading}
                className="w-full bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50 h-10 flex items-center justify-center"
              >
                {loading ? <Loader /> : "Login"}
              </Button>

              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-sm text-gray-400 hover:text-white transition-colors w-full text-center"
              >
                ← Use a different email
              </button>
            </form>
          </>
        )}

        {/* Signup Password Step */}
        {step === "signup-password" && (
          <>
            <h2 className="text-2xl font-bold text-white mb-3">Create Account</h2>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Set up your password
            </p>

            <form onSubmit={handleSignupPasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-black border-gray-800 text-white placeholder-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />

              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-black border-gray-800 text-white placeholder-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />

              {/* Password requirements */}
              <div className="space-y-2 text-xs">
                <p className="text-gray-500 font-semibold mb-2">Password must have:</p>
                {[
                  { label: "8+ characters", valid: password.length >= 8 },
                  { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
                  { label: "Lowercase letter", valid: /[a-z]/.test(password) },
                  { label: "Number", valid: /[0-9]/.test(password) },
                  { label: "Special character", valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
                ].map((req) => (
                  <div key={req.label} className="flex items-center gap-2">
                    <svg
                      className={`w-3 h-3 ${req.valid ? "text-green-500" : "text-gray-600"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className={req.valid ? "text-green-500" : "text-gray-500"}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                disabled={!passwordValidation.isValid || !passwordsMatch || loading}
                className="w-full bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50 h-10 flex items-center justify-center"
              >
                {loading ? <Loader /> : "Continue"}
              </Button>

              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-sm text-gray-400 hover:text-white transition-colors w-full text-center"
              >
                ← Use a different email
              </button>
            </form>
          </>
        )}

        {/* Username Step */}
        {step === "username" && (
          <>
            <h2 className="text-2xl font-bold text-white mb-3">Choose Username</h2>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Pick a unique username for your profile
            </p>

            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                <Input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsernameState(e.target.value)}
                  required
                  className={`bg-black border-gray-800 text-white placeholder-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 pl-8 pr-10 ${
                    usernameAvailable === true ? "border-green-500/50" : ""
                  } ${
                    usernameAvailable === false ? "border-red-500/50" : ""
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingUsername && (
                    <Loader className="w-4 h-4 text-gray-400" />
                  )}
                  {usernameAvailable === true && (
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {usernameAvailable === false && (
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={username.length < 3 || usernameAvailable === false || checkingUsername || loading}
                className="w-full bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50 h-10 flex items-center justify-center"
              >
                {loading ? <Loader /> : "Complete Setup"}
              </Button>
            </form>
          </>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="text-center py-8">
            <div className="mb-4 flex justify-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {isLogin ? "Welcome Back!" : "Account Created!"}
            </h3>
            <p className="text-gray-400 text-sm">
              {isLogin ? "You have successfully logged in" : "Your account has been created successfully"}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
