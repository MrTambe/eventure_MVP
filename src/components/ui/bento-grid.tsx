"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 w-full",
        className
      )}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  colSpan?: "1" | "2" | "3";
  rowSpan?: "1" | "2";
  gradient?: string;
}

export function BentoCard({
  title,
  description,
  children,
  className,
  colSpan,
  rowSpan,
  gradient = "from-primary/10 to-primary/5",
}: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden bg-gradient-to-br",
        gradient,
        "border-4 border-black dark:border-white p-6",
        "shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#fff]",
        "hover:shadow-[12px_12px_0px_#000] dark:hover:shadow-[12px_12px_0px_#fff]",
        "hover:-translate-y-1 transition-all duration-300",
        className
      )}
    >
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-black/5 dark:bg-white/5 -mr-8 -mt-8 rotate-45" />
      
      <div className="mb-4 relative z-10">
        <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="h-full relative z-10">{children}</div>
    </motion.div>
  );
}