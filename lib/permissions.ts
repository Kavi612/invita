import React from "react";
import { Role } from "@/types";

export type PermissionAction =
  // Community Actions
  | "community:create"
  | "community:edit"
  | "community:delete"
  | "community:settings"
  // Member Actions
  | "member:view"
  | "member:invite"
  | "member:edit"
  | "member:delete"
  // Family Actions
  | "family:view"
  | "family:create"
  | "family:manage"
  // Event Actions
  | "event:view"
  | "event:create"
  | "event:edit"
  | "event:delete"
  | "event:publish"
  // Invitation Actions
  | "invitation:view"
  | "invitation:create"
  | "invitation:send"
  | "invitation:manage"
  // RSVP Actions
  | "rsvp:view_all"
  | "rsvp:export"
  | "rsvp:submit"
  | "rsvp:manage_family"
  // Media Actions
  | "media:view"
  | "media:upload"
  | "media:delete"
  // Analytics & System
  | "analytics:view"
  | "system:settings";

/**
 * Invita Canonical Permission Matrix
 * Role -> Set of allowed actions
 */
export const PERMISSION_MATRIX: Record<PermissionAction, Role[]> = {
  // Community Governance
  "community:create": ["super_admin"],
  "community:edit": ["super_admin", "community_admin"],
  "community:delete": ["super_admin"],
  "community:settings": ["super_admin", "community_admin"],

  // Member Management
  "member:view": ["super_admin", "community_admin", "event_organizer", "family_head", "member"],
  "member:invite": ["super_admin", "community_admin"],
  "member:edit": ["super_admin", "community_admin"],
  "member:delete": ["super_admin", "community_admin"],

  // Family Registry
  "family:view": ["super_admin", "community_admin", "event_organizer", "family_head", "member"],
  "family:create": ["super_admin", "community_admin"],
  "family:manage": ["super_admin", "community_admin", "family_head"],

  // Events & Gatherings (Community Admin and above)
  "event:view": ["super_admin", "community_admin", "event_organizer", "family_head", "member", "guest"],
  "event:create": ["super_admin", "community_admin"],
  "event:edit": ["super_admin", "community_admin"],
  "event:delete": ["super_admin", "community_admin"],
  "event:publish": ["super_admin", "community_admin"],

  // Digital Invitations
  "invitation:view": ["super_admin", "community_admin", "event_organizer", "family_head", "member", "guest"],
  "invitation:create": ["super_admin", "community_admin", "event_organizer"],
  "invitation:send": ["super_admin", "community_admin", "event_organizer"],
  "invitation:manage": ["super_admin", "community_admin", "event_organizer"],

  // RSVP Tracking & Attendance
  "rsvp:view_all": ["super_admin", "community_admin", "event_organizer"],
  "rsvp:export": ["super_admin", "community_admin", "event_organizer"],
  "rsvp:submit": ["super_admin", "community_admin", "event_organizer", "family_head", "member", "guest"],
  "rsvp:manage_family": ["super_admin", "community_admin", "family_head"],

  // Media & Album Assets
  "media:view": ["super_admin", "community_admin", "event_organizer", "family_head", "member", "guest"],
  "media:upload": ["super_admin", "community_admin", "event_organizer", "family_head", "member"],
  "media:delete": ["super_admin", "community_admin"],

  // Analytics & Platform Governance
  "analytics:view": ["super_admin", "community_admin", "event_organizer"],
  "system:settings": ["super_admin"],
};

export const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 100,
  community_admin: 80,
  event_organizer: 60,
  family_head: 40,
  member: 20,
  guest: 10,
};

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  community_admin: "Community Admin",
  event_organizer: "Event Organizer",
  family_head: "Family Head",
  member: "Member",
  guest: "Guest",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: "Platform oversight, global configuration, and multi-community governance.",
  community_admin: "Full management of community members, family registries, and policies.",
  event_organizer: "Creator and coordinator of events, invitations, and attendee RSVPs.",
  family_head: "Household representative coordinating collective RSVPs and family members.",
  member: "Active community participant responding to invites and viewing celebrations.",
  guest: "Invited guest viewing invitations and submitting individual attendance.",
};

/**
 * Check if a role is authorized to perform an action
 */
export function can(role: Role | null | undefined, action: PermissionAction): boolean {
  if (!role) return false;
  if (role === "super_admin") return true;
  const allowed = PERMISSION_MATRIX[action];
  if (!allowed) return false;
  return allowed.includes(role);
}

export function hasRole(currentRole: Role | null | undefined, allowedRoles: Role[]): boolean {
  if (!currentRole) return false;
  if (currentRole === "super_admin") return true;
  return allowedRoles.includes(currentRole);
}

export function isAtLeastRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function getRoleBadgeVariant(role: Role): {
  color: string;
  bgColor: string;
  borderColor: string;
} {
  switch (role) {
    case "super_admin":
      return {
        color: "text-purple-700 dark:text-purple-300",
        bgColor: "bg-purple-50 dark:bg-purple-950/50",
        borderColor: "border-purple-200 dark:border-purple-800",
      };
    case "community_admin":
      return {
        color: "text-indigo-700 dark:text-indigo-300",
        bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
        borderColor: "border-indigo-200 dark:border-indigo-800",
      };
    case "event_organizer":
      return {
        color: "text-amber-700 dark:text-amber-300",
        bgColor: "bg-amber-50 dark:bg-amber-950/50",
        borderColor: "border-amber-200 dark:border-amber-800",
      };
    case "family_head":
      return {
        color: "text-emerald-700 dark:text-emerald-300",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
        borderColor: "border-emerald-200 dark:border-emerald-800",
      };
    case "member":
      return {
        color: "text-blue-700 dark:text-blue-300",
        bgColor: "bg-blue-50 dark:bg-blue-950/50",
        borderColor: "border-blue-200 dark:border-blue-800",
      };
    case "guest":
    default:
      return {
        color: "text-zinc-600 dark:text-zinc-400",
        bgColor: "bg-zinc-100 dark:bg-zinc-800",
        borderColor: "border-zinc-200 dark:border-zinc-700",
      };
  }
}

// Re-export Can and usePermission for unified access from @/lib/permissions
export { Can } from "@/components/shared/Can";
export { usePermission, usePermissions } from "@/hooks/use-permission";

