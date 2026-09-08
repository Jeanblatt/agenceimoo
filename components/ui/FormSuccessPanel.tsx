"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Button from "@/components/ui/Button";

interface FormSuccessPanelProps {
  icon: ReactNode;
  title: string;
  message: string;
  resetLabel: string;
  onReset: () => void;
}

// Panneau de succès affiché après soumission — balisage identique dupliqué
// entre ContactForm et VisitRequestForm avant V2.1.
export default function FormSuccessPanel({ icon, title, message, resetLabel, onReset }: FormSuccessPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center rounded-card bg-surface-muted p-10 text-center ring-1 ring-border"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">{icon}</div>
      <h3 className="mt-6 font-serif text-2xl text-charcoal">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600">{message}</p>
      <Button variant="ghost" className="mt-6" onClick={onReset}>
        {resetLabel}
      </Button>
    </motion.div>
  );
}
