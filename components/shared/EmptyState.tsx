"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "secondary" | "subtle";
}

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Sparkles,
  action,
  secondaryAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200/90 bg-zinc-50/50 p-8 text-center transition-all dark:border-zinc-800/80 dark:bg-zinc-900/30",
        className
      )}
    >
      <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50/80 text-indigo-600 shadow-inner ring-1 ring-indigo-500/20 dark:bg-indigo-950/40 dark:text-indigo-400">
        <Icon className="h-8 w-8" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
        </span>
      </div>

      <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>

      <p className="mt-1.5 max-w-sm text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
        {description}
      </p>

      {(action || secondaryAction || children) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action && (
            action.href ? (
              <Button asChild variant={action.variant || "default"}>
                <Link href={action.href}>
                  {action.icon && <action.icon className="h-4 w-4" />}
                  {action.label}
                </Link>
              </Button>
            ) : (
              <Button onClick={action.onClick} variant={action.variant || "default"}>
                {action.icon && <action.icon className="h-4 w-4" />}
                {action.label}
              </Button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <Button asChild variant={secondaryAction.variant || "outline"}>
                <Link href={secondaryAction.href}>
                  {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" />}
                  {secondaryAction.label}
                </Link>
              </Button>
            ) : (
              <Button onClick={secondaryAction.onClick} variant={secondaryAction.variant || "outline"}>
                {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" />}
                {secondaryAction.label}
              </Button>
            )
          )}

          {children}
        </div>
      )}
    </div>
  );
}
