"use client";

import Link from "next/link";
import { cn } from "@/shared/lib/cn";

type Variant = "solid" | "outline" | "text";

const VARIANTS: Record<Variant, string> = {
  solid: "bg-ink text-paper border-ink hover:bg-ink-2 hover:border-ink-2",
  outline: "border-rule text-ink hover:border-ink",
  text: "border-transparent text-ink-2 hover:text-ink px-0",
};

type Props = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  className?: string;
  "aria-label"?: string;
};

export function Button({ children, href, onClick, variant = "solid", className, ...rest }: Props) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3",
    "text-[13px] font-medium tracking-tight transition-colors duration-300",
    "focus-visible:outline-ink focus-visible:outline-2 focus-visible:outline-offset-2",
    VARIANTS[variant],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes} {...rest}>
      {children}
    </button>
  );
}
