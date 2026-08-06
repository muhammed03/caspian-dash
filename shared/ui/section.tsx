"use client";

import { motion } from "motion/react";
import { cn } from "@/shared/lib/cn";
import { fadeUp, stagger, viewportOnce } from "@/shared/lib/motion";

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "text-glow/70 inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase",
        className
      )}
    >
      <span className="bg-glow/50 h-px w-8" />
      {children}
    </span>
  );
}

export function SectionTitle({
  children,
  className,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      className={cn(
        "font-display text-balance font-semibold tracking-tight",
        Tag === "h1" ? "text-5xl leading-[0.95] md:text-7xl xl:text-8xl" : "text-3xl leading-[1.05] md:text-5xl",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-mist/75 max-w-xl text-base leading-relaxed md:text-lg", className)}>{children}</p>
  );
}

/** Standard reveal wrapper: children rise in sequence when scrolled into view. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={stagger(delay)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}
