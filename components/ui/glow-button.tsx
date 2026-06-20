"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const GLOW_BG =
  "radial-gradient(75% 120% at 50% 135%, rgba(255,210,210,0.95) 0%, rgba(255,120,120,0.55) 30%, rgba(220,38,38,0.15) 55%, transparent 72%)";

const sizes = {
  sm: "px-5 py-2.5 text-sm rounded-[10px] gap-1.5",
  md: "px-7 py-3.5 text-sm rounded-[12px] gap-2",
  lg: "px-8 py-4 text-base rounded-[14px] gap-2",
} as const;

type GlowButtonProps = {
  size?: keyof typeof sizes;
  className?: string;
  children: React.ReactNode;
} & (
  | ({ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
);

/**
 * Primary CTA for the whole app: red squircle with a "mountain" glow rising
 * from the bottom-center, intensifying on hover. Renders an <a> when `href`
 * is set, otherwise a <button>.
 */
export const GlowButton = forwardRef<HTMLElement, GlowButtonProps>(function GlowButton(
  { size = "md", className, children, ...props },
  ref
) {
  const base = cn(
    "group relative overflow-hidden inline-flex items-center justify-center font-semibold text-white",
    "bg-red-700 shadow-lg shadow-red-950/50 transition-all duration-200",
    sizes[size],
    className
  );

  const glow = (
    <span
      aria-hidden="true"
      className="absolute inset-0 opacity-90 transition-all duration-300 group-hover:opacity-100 group-hover:brightness-150 group-hover:scale-110 group-hover:saturate-150"
      style={{ background: GLOW_BG }}
    />
  );

  const inner = <span className="relative z-10 inline-flex items-center gap-2">{children}</span>;

  if ("href" in props && props.href !== undefined) {
    const { href, ...rest } = props as React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    return (
      <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={base} {...rest}>
        {glow}
        {inner}
      </a>
    );
  }

  const btnProps = props as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} className={base} {...btnProps}>
      {glow}
      {inner}
    </button>
  );
});
