import { useAuthStore } from "@/hooks/use-auth";
import { PermissionAction, can as checkCan, hasRole as checkHasRole, isAtLeastRole, ROLE_HIERARCHY } from "@/lib/permissions";
import { Role } from "@/types";

/**
 * Hook to check if the currently authenticated user can perform an action
 */
export function usePermission(action: PermissionAction, roleOverride?: Role | null): boolean {
  const currentRole = useAuthStore((state) => state.currentRole);
  const effectiveRole = roleOverride !== undefined ? roleOverride : currentRole;
  return checkCan(effectiveRole, action);
}

/**
 * Hook returning comprehensive permission helpers for current user
 */
export function usePermissions() {
  const currentRole = useAuthStore((state) => state.currentRole);

  return {
    role: currentRole,
    can: (action: PermissionAction) => checkCan(currentRole, action),
    hasRole: (roles: Role[]) => checkHasRole(currentRole, roles),
    isAtLeast: (requiredRole: Role) =>
      currentRole ? isAtLeastRole(currentRole, requiredRole) : false,
    isAdmin: currentRole === "super_admin" || currentRole === "community_admin",
  };
}
