"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { springSnappy } from "@/shared/lib/motion";

type Variant = "primary" | "ghost" | "outline";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-glow/15 text-glow border-glow/30 hover:bg-glow/25 hover:border-glow/50 hover:shadow-[0_0_32px_-4px_rgba(34,211,238,0.45)]",
  ghost: "text-mist hover:text-foam border-transparent hover:bg-white/5",
  outline: "glass text-foam hover:border-white/20 hover:bg-white/[0.07]",
};

type Props = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  className?: string;
  /** Pull toward the cursor on hover — used on the few hero-level actions. */
  magnetic?: boolean;
  "aria-label"?: string;
};

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  className,
  magnetic = false,
  ...rest
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  function handleMove(e: React.MouseEvent) {
    if (!magnetic || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setOffset({
      x: (e.clientX - (r.left + r.width / 2)) * 0.25,
      y: (e.clientY - (r.top + r.height / 2)) * 0.35,
    });
  }

  const classes = cn(
    "relative inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3",
    "text-sm font-medium transition-colors duration-300",
    "focus-visible:outline-glow focus-visible:outline-2 focus-visible:outline-offset-2",
    VARIANTS[variant],
    className
  );

  const inner = (
    <motion.span
      animate={{ x: offset.x, y: offset.y }}
      transition={springSnappy}
      className="pointer-events-none inline-flex items-center gap-2"
    >
      {children}
    </motion.span>
  );

  const handlers = {
    onMouseMove: handleMove,
    onMouseLeave: () => setOffset({ x: 0, y: 0 }),
  };

  if (href) {
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={classes}
        {...handlers}
        {...rest}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      className={classes}
      {...handlers}
      {...rest}
    >
      {inner}
    </button>
  );
}
