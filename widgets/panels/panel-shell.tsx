"use client";

import { motion } from "motion/react";
import { cn } from "@/shared/lib/cn";
import { stagger, fadeUp } from "@/shared/lib/motion";

export function PanelShell({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={stagger(0.05, 0.07)}
      initial="hidden"
      animate="show"
      className={cn("space-y-4 pb-10", className)}
    >
      <motion.h1 variants={fadeUp} className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </motion.h1>
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
