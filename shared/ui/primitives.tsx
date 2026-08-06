"use client";

import { motion } from "motion/react";
import { cn } from "@/shared/lib/cn";
import { fadeUp, stagger, viewportOnce } from "@/shared/lib/motion";

/**
 * The page is built from four things: a small grey label, a value, a hairline,
 * and a lot of empty space. These are those four things.
 */

/** Small uppercase caption that names the value under it. */
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("label", className)}>{children}</div>;
}

/**
 * A labelled value in a row of hairline-separated columns — the meta strip
 * that runs along the bottom of the hero and under each section.
 */
export function MetaCell({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rule-t pt-3", className)}>
      <Label>{label}</Label>
      <div className="text-ink mt-1.5 text-sm leading-snug">{children}</div>
    </div>
  );
}

export function MetaRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </div>
  );
}

/** Numbered section opener: 01 / SECTION NAME. */
export function SectionMark({
  index,
  children,
  className,
}: {
  index: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rule-t flex items-baseline gap-4 pt-4", className)}>
      <span className="label tabular text-ink">{String(index).padStart(2, "0")}</span>
      <span className="label">{children}</span>
    </div>
  );
}

export function Display({
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
        "display text-balance",
        Tag === "h1" ? "text-[13vw] md:text-[7vw] xl:text-[92px]" : "text-4xl md:text-6xl",
        className
      )}
    >
      {children}
    </Tag>
  );
}

/** Body copy, deliberately narrow so it stays readable. */
export function Lede({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-ink-2 max-w-[52ch] text-base leading-relaxed md:text-lg", className)}>
      {children}
    </p>
  );
}

/**
 * The plain-language note that sits under a number and says what it means.
 * Present on every metric on the site — this is what makes the data readable
 * to someone who has never seen a hydrology chart.
 */
export function Plain({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-ink-2 max-w-[46ch] text-[13px] leading-relaxed", className)}>
      {children}
    </p>
  );
}

/** Flat panel: hairline border, no shadow, no blur. */
export function Panel({
  children,
  className,
  tint = false,
}: {
  children: React.ReactNode;
  className?: string;
  tint?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-rule rounded-lg border",
        tint ? "bg-tint" : "bg-paper",
        className
      )}
    >
      {children}
    </div>
  );
}

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
