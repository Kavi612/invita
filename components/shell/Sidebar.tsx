"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Home,
  CalendarDays,
  MailOpen,
  UserCheck,
  Image as ImageIcon,
  SlidersHorizontal,
  ShieldAlert,
  Sparkles,
  Layers,
  ChevronRight,
  X,
  LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth";
import { getNavigationForRole } from "@/hooks/use-navigation";
import { ROLE_LABELS, getRoleBadgeVariant } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Building2,
  Users,
  Home,
  CalendarDays,
  MailOpen,
  UserCheck,
  Image: ImageIcon,
  SlidersHorizontal,
  ShieldAlert,
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ isOpen, onClose, className }: SidebarProps) {
  const pathname = usePathname();
  const { currentRole, currentUser } = useAuthStore();
  const role = currentRole || "guest";
  const sections = getNavigationForRole(role);
  const roleBadgeStyle = getRoleBadgeVariant(role);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-zinc-200/90 bg-white/95 dark:border-zinc-800/80 dark:bg-zinc-950/95 backdrop-blur-md transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-100 dark:border-zinc-800/80">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                Invita
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  v1.0
                </span>
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[140px]">
                Community & Events
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 lg:hidden dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Active Role Indicator */}
        <div className="mx-4 mt-4 rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-500 dark:text-zinc-400">
              Active Context
            </span>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                roleBadgeStyle.bgColor,
                roleBadgeStyle.color,
                roleBadgeStyle.borderColor
              )}
            >
              {ROLE_LABELS[role]}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
            Navigation filtered by role permissions
          </p>
        </div>

        {/* Navigation Links (Grouped by Section) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {section.title}
              </div>
              <div className="mt-1 space-y-1">
                {section.items.map((item) => {
                  const Icon = ICON_MAP[item.iconName] || Sparkles;
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onClose && onClose()}
                      className={cn(
                        "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold shadow-xs"
                          : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                          )}
                        />
                        <span>{item.title}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span
                            className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                              isActive
                                ? "bg-indigo-200/70 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <ChevronRight className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer User Card */}
        <div className="border-t border-zinc-100 p-4 dark:border-zinc-800/80">
          <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
            <Avatar className="h-9 w-9 border border-indigo-200/50 dark:border-indigo-800/50">
              <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.name || "User"} />
              <AvatarFallback>{getInitials(currentUser?.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {currentUser?.name || "Invited User"}
              </span>
              <span className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                {currentUser?.email || "Signed in"}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
