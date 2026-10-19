"use client";

import React from "react";
import { PermissionAction, can as checkCan } from "@/lib/permissions";
import { useAuthStore } from "@/hooks/use-auth";
import { Role } from "@/types";

export interface CanProps {
  action: PermissionAction;
  role?: Role | null;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditional permission-gate component:
 * Renders children only if current user's role has permission for the specified action.
 *
 * Example:
 * <Can action="event:create">
 *   <Button>Create Event</Button>
 * </Can>
 */
export function Can({ action, role, fallback = null, children }: CanProps) {
  const currentRole = useAuthStore((state) => state.currentRole);
  const effectiveRole = role !== undefined ? role : currentRole;

  const isAllowed = checkCan(effectiveRole, action);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
