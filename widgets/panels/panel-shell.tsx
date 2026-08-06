"use client";

import { motion } from "motion/react";
import { cn } from "@/shared/lib/cn";
import { stagger, fadeUp } from "@/shared/lib/motion";

export function PanelShell({
  title,
  intro,
  children,
  className,
}: {
  title: string;
  /** One sentence telling a first-time reader what this dashboard shows. */
  intro?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={stagger(0.04, 0.06)}
      initial="hidden"
      animate="show"
      className={cn("space-y-6 pb-12", className)}
    >
      <motion.header variants={fadeUp}>
        <h1 className="display text-2xl md:text-3xl">{title}</h1>
        {intro && <p className="text-ink-2 mt-2.5 text-[13px] leading-relaxed">{intro}</p>}
      </motion.header>
      {children}
    </motion.div>
  );
}

export function PanelItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}
