"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  backHref?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  backHref,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-zinc-200/80 pb-6 pt-2 dark:border-zinc-800/80 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1.5">
        {/* Optional Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-zinc-900 hover:underline dark:hover:text-zinc-100 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={cn(isLast && "font-medium text-zinc-900 dark:text-zinc-100")}>
                      {crumb.label}
                    </span>
                  )}
                  {!isLast && <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        {/* Title, Badge & Back Button */}
        <div className="flex items-center gap-3 flex-wrap">
          {backHref && (
            <Button
              variant="outline"
              size="icon-sm"
              asChild
              className="h-8 w-8 rounded-lg"
            >
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Go back</span>
              </Link>
            </Button>
          )}

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            {title}
          </h1>

          {badge && <div className="inline-flex items-center">{badge}</div>}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}
