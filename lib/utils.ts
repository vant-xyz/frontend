import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("At least 8 characters");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("One lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("One uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("One number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("One special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function formatPrice(price: string | number): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numPrice);
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 5) return "Just now";
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function getPriceChangeColor(current: string, previous: string): string {
  const currentPrice = parseFloat(current);
  const previousPrice = parseFloat(previous);

  if (currentPrice > previousPrice) return "text-green-500";
  if (currentPrice < previousPrice) return "text-red-500";
  return "text-gray-400";
}
