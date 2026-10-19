"use client";

import React from "react";
import {
  Menu,
  Bell,
  Search,
  Building2,
  ChevronDown,
  Check,
  Shield,
  User as UserIcon,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/hooks/use-auth";
import { mockCommunities } from "@/lib/mock/data";
import { ROLE_LABELS, getRoleBadgeVariant } from "@/lib/permissions";
import { useRouter } from "next/navigation";
import { Role } from "@/types";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onToggleSidebar?: () => void;
}

const ALL_ROLES: Role[] = [
  "super_admin",
  "community_admin",
  "event_organizer",
  "family_head",
  "member",
  "guest",
];

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const router = useRouter();
  const {
    currentUser,
    currentRole,
    activeCommunityId,
    switchRole,
    switchUser,
    availableUsers,
    setActiveCommunityId,
    logout,
  } = useAuthStore();

  const role = currentRole || "guest";

  const activeCommunity =
    mockCommunities.find((c) => c.id === activeCommunityId) ||
    mockCommunities[0];

  const roleStyle = getRoleBadgeVariant(role);

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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200/80 bg-white/90 px-4 sm:px-6 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          className="lg:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Community Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-1.5 text-xs font-semibold text-zinc-800 transition-all hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800">
              <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="truncate max-w-[150px] sm:max-w-[200px]">
                {activeCommunity.name}
              </span>
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Select Community</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mockCommunities.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => setActiveCommunityId(c.id)}
                className="flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-xs">{c.name}</span>
                  <span className="text-[10px] text-zinc-400">
                    {c.memberCount} members · {c.eventCount} events
                  </span>
                </div>
                {c.id === activeCommunityId && (
                  <Check className="h-4 w-4 text-indigo-600" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Switcher Pill (Interactive Demo Tool for role testing) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all hover:opacity-90 shadow-2xs",
                roleStyle.bgColor,
                roleStyle.color,
                roleStyle.borderColor
              )}
              title="Click to switch role and inspect navigation changes"
            >
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline font-semibold">
                Role:
              </span>
              <span className="font-semibold">{ROLE_LABELS[role]}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Switch Testing Role</span>
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            </DropdownMenuLabel>
            <p className="px-2.5 pb-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              Changes sidebar navigation & UI permissions in real-time.
            </p>
            <DropdownMenuSeparator />
            {ALL_ROLES.map((role) => (
              <DropdownMenuItem
                key={role}
                onClick={() => switchRole(role)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="text-xs font-medium">{ROLE_LABELS[role]}</span>
                {role === currentRole && (
                  <Check className="h-4 w-4 text-indigo-600" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications Icon */}
        <Button
          variant="outline"
          size="icon-sm"
          className="relative h-9 w-9 rounded-xl border-zinc-200 text-zinc-600 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
          </span>
        </Button>

        {/* User Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <Avatar className="h-8 w-8 ring-2 ring-indigo-500/20">
                <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.name || "User"} />
                <AvatarFallback>{getInitials(currentUser?.name)}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="flex items-center gap-3 p-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.name || "User"} />
                <AvatarFallback>{getInitials(currentUser?.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {currentUser?.name || "User"}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {currentUser?.email || ""}
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {ROLE_LABELS[role]}
                </span>
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuLabel>Switch Test User</DropdownMenuLabel>
            {availableUsers.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => switchUser(user.id)}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-[10px] text-zinc-400">
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
                {user.id === currentUser?.id && (
                  <Check className="h-3.5 w-3.5 text-indigo-600" />
                )}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="text-xs text-rose-600 dark:text-rose-400 cursor-pointer"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
