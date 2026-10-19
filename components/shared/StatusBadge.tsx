"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  User,
  Users,
  Send,
  Eye,
} from "lucide-react";

export type StatusCategory =
  | "event"
  | "rsvp"
  | "member"
  | "invitation"
  | "role"
  | "generic";

interface StatusConfig {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple";
  icon?: React.ComponentType<{ className?: string }>;
  dotClass?: string;
}

const STATUS_CONFIGS: Record<string, StatusConfig> = {
  // Event Statuses
  draft: { label: "Draft", variant: "secondary", icon: Clock, dotClass: "bg-zinc-400" },
  published: { label: "Published", variant: "success", icon: Sparkles, dotClass: "bg-emerald-500" },
  ongoing: { label: "Happening Now", variant: "warning", icon: Clock, dotClass: "bg-amber-500 animate-ping" },
  completed: { label: "Completed", variant: "info", icon: CheckCircle2, dotClass: "bg-sky-500" },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle, dotClass: "bg-rose-500" },

  // RSVP Statuses
  attending: { label: "Attending", variant: "success", icon: CheckCircle2, dotClass: "bg-emerald-500" },
  declined: { label: "Declined", variant: "destructive", icon: XCircle, dotClass: "bg-rose-500" },
  tentative: { label: "Tentative", variant: "warning", icon: HelpCircle, dotClass: "bg-amber-500" },
  waitlisted: { label: "Waitlisted", variant: "info", icon: Clock, dotClass: "bg-sky-500" },

  // Member Statuses
  active: { label: "Active", variant: "success", icon: CheckCircle2, dotClass: "bg-emerald-500" },
  invited: { label: "Invited", variant: "info", icon: Clock, dotClass: "bg-sky-400" },
  pending: { label: "Pending Approval", variant: "warning", icon: AlertCircle, dotClass: "bg-amber-500" },
  suspended: { label: "Suspended", variant: "destructive", icon: XCircle, dotClass: "bg-rose-500" },

  // Invitation Statuses
  sent: { label: "Sent", variant: "secondary", icon: Send, dotClass: "bg-zinc-400" },
  delivered: { label: "Delivered", variant: "info", icon: CheckCircle2, dotClass: "bg-sky-500" },
  opened: { label: "Opened", variant: "warning", icon: Eye, dotClass: "bg-amber-500" },
  responded: { label: "Responded", variant: "success", icon: CheckCircle2, dotClass: "bg-emerald-500" },
  expired: { label: "Expired", variant: "outline", icon: Clock, dotClass: "bg-zinc-400" },

  // Roles
  super_admin: { label: "Super Admin", variant: "purple", icon: ShieldCheck, dotClass: "bg-purple-500" },
  community_admin: { label: "Community Admin", variant: "default", icon: ShieldCheck, dotClass: "bg-indigo-500" },
  event_organizer: { label: "Event Organizer", variant: "warning", icon: Sparkles, dotClass: "bg-amber-500" },
  family_head: { label: "Family Head", variant: "success", icon: Users, dotClass: "bg-emerald-500" },
  member: { label: "Member", variant: "info", icon: User, dotClass: "bg-sky-500" },
  guest: { label: "Guest", variant: "secondary", icon: User, dotClass: "bg-zinc-400" },
};

export interface StatusBadgeProps {
  status: string;
  category?: StatusCategory;
  showIcon?: boolean;
  showDot?: boolean;
  pulse?: boolean;
  className?: string;
  customLabel?: string;
}

export function StatusBadge({
  status,
  showIcon = false,
  showDot = true,
  pulse = false,
  className,
  customLabel,
}: StatusBadgeProps) {
  const normalizedKey = status.toLowerCase().replace(/[\s-]/g, "_");
  const config = STATUS_CONFIGS[normalizedKey] || {
    label: customLabel || status.charAt(0).toUpperCase() + status.slice(1),
    variant: "secondary" as const,
    dotClass: "bg-zinc-400",
  };

  const Icon = config.icon;
  const label = customLabel || config.label;

  return (
    <Badge
      variant={config.variant}
      className={cn("font-medium tracking-tight text-[11px] gap-1.5 py-0.5", className)}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                config.dotClass
              )}
            />
          )}
          <span
            className={cn("relative inline-flex rounded-full h-2 w-2", config.dotClass)}
          />
        </span>
      )}
      {showIcon && Icon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{label}</span>
    </Badge>
  );
}
