import { describe, it, expect } from "vitest";
import {
  can,
  hasRole,
  isAtLeastRole,
  getRoleBadgeVariant,
  PERMISSION_MATRIX,
  ROLE_HIERARCHY,
  PermissionAction,
} from "@/lib/permissions";
import { Role } from "@/types";

const ALL_ROLES: Role[] = [
  "super_admin",
  "community_admin",
  "event_organizer",
  "family_head",
  "member",
  "guest",
];

const ALL_ACTIONS: PermissionAction[] = [
  "community:create",
  "community:edit",
  "community:delete",
  "community:settings",
  "member:view",
  "member:invite",
  "member:edit",
  "member:delete",
  "family:view",
  "family:create",
  "family:manage",
  "event:view",
  "event:create",
  "event:edit",
  "event:delete",
  "event:publish",
  "invitation:view",
  "invitation:create",
  "invitation:send",
  "invitation:manage",
  "rsvp:view_all",
  "rsvp:export",
  "rsvp:submit",
  "rsvp:manage_family",
  "media:view",
  "media:upload",
  "media:delete",
  "analytics:view",
  "system:settings",
];

describe("Permission Matrix: can(role, action)", () => {
  describe("Super Admin - Global Unrestricted Access", () => {
    it.each(ALL_ACTIONS)("allows super_admin to perform '%s'", (action) => {
      expect(can("super_admin", action)).toBe(true);
    });
  });

  describe("Community Admin - Community Governance & Event Management", () => {
    it("allows community management actions", () => {
      expect(can("community_admin", "community:edit")).toBe(true);
      expect(can("community_admin", "community:settings")).toBe(true);
      expect(can("community_admin", "member:invite")).toBe(true);
      expect(can("community_admin", "member:edit")).toBe(true);
      expect(can("community_admin", "member:delete")).toBe(true);
      expect(can("community_admin", "family:create")).toBe(true);
      expect(can("community_admin", "family:manage")).toBe(true);
    });

    it("allows full event lifecycle management", () => {
      expect(can("community_admin", "event:view")).toBe(true);
      expect(can("community_admin", "event:create")).toBe(true);
      expect(can("community_admin", "event:edit")).toBe(true);
      expect(can("community_admin", "event:delete")).toBe(true);
      expect(can("community_admin", "event:publish")).toBe(true);
      expect(can("community_admin", "invitation:create")).toBe(true);
      expect(can("community_admin", "invitation:send")).toBe(true);
      expect(can("community_admin", "rsvp:view_all")).toBe(true);
      expect(can("community_admin", "rsvp:export")).toBe(true);
      expect(can("community_admin", "media:delete")).toBe(true);
      expect(can("community_admin", "analytics:view")).toBe(true);
    });

    it("blocks super_admin-only system actions", () => {
      expect(can("community_admin", "community:create")).toBe(false);
      expect(can("community_admin", "community:delete")).toBe(false);
      expect(can("community_admin", "system:settings")).toBe(false);
    });
  });

  describe("Event Organizer - Coordination & RSVP Operations", () => {
    it("allows invitation, RSVP, and media upload actions", () => {
      expect(can("event_organizer", "event:view")).toBe(true);
      expect(can("event_organizer", "invitation:view")).toBe(true);
      expect(can("event_organizer", "invitation:create")).toBe(true);
      expect(can("event_organizer", "invitation:send")).toBe(true);
      expect(can("event_organizer", "invitation:manage")).toBe(true);
      expect(can("event_organizer", "rsvp:view_all")).toBe(true);
      expect(can("event_organizer", "rsvp:export")).toBe(true);
      expect(can("event_organizer", "rsvp:submit")).toBe(true);
      expect(can("event_organizer", "media:view")).toBe(true);
      expect(can("event_organizer", "media:upload")).toBe(true);
      expect(can("event_organizer", "analytics:view")).toBe(true);
    });

    it("blocks event creation and community modification", () => {
      expect(can("event_organizer", "event:create")).toBe(false);
      expect(can("event_organizer", "event:edit")).toBe(false);
      expect(can("event_organizer", "event:delete")).toBe(false);
      expect(can("event_organizer", "community:edit")).toBe(false);
      expect(can("event_organizer", "member:delete")).toBe(false);
      expect(can("event_organizer", "media:delete")).toBe(false);
    });
  });

  describe("Family Head - Household Representative", () => {
    it("allows viewing members/families and managing household RSVPs", () => {
      expect(can("family_head", "family:view")).toBe(true);
      expect(can("family_head", "family:manage")).toBe(true);
      expect(can("family_head", "rsvp:submit")).toBe(true);
      expect(can("family_head", "rsvp:manage_family")).toBe(true);
      expect(can("family_head", "media:upload")).toBe(true);
    });

    it("blocks organizer and admin privileges", () => {
      expect(can("family_head", "event:create")).toBe(false);
      expect(can("family_head", "invitation:send")).toBe(false);
      expect(can("family_head", "rsvp:view_all")).toBe(false);
      expect(can("family_head", "rsvp:export")).toBe(false);
      expect(can("family_head", "analytics:view")).toBe(false);
    });
  });

  describe("Member - Community Participant", () => {
    it("allows basic participation", () => {
      expect(can("member", "member:view")).toBe(true);
      expect(can("member", "family:view")).toBe(true);
      expect(can("member", "event:view")).toBe(true);
      expect(can("member", "invitation:view")).toBe(true);
      expect(can("member", "rsvp:submit")).toBe(true);
      expect(can("member", "media:view")).toBe(true);
      expect(can("member", "media:upload")).toBe(true);
    });

    it("blocks administrative and coordination actions", () => {
      expect(can("member", "event:create")).toBe(false);
      expect(can("member", "invitation:send")).toBe(false);
      expect(can("member", "rsvp:view_all")).toBe(false);
      expect(can("member", "rsvp:export")).toBe(false);
      expect(can("member", "media:delete")).toBe(false);
      expect(can("member", "analytics:view")).toBe(false);
    });
  });

  describe("Guest - Minimal Public Access", () => {
    it("allows viewing events/invitations and submitting personal RSVP", () => {
      expect(can("guest", "event:view")).toBe(true);
      expect(can("guest", "invitation:view")).toBe(true);
      expect(can("guest", "rsvp:submit")).toBe(true);
      expect(can("guest", "media:view")).toBe(true);
    });

    it("blocks all member and management operations", () => {
      expect(can("guest", "member:view")).toBe(false);
      expect(can("guest", "family:view")).toBe(false);
      expect(can("guest", "media:upload")).toBe(false);
      expect(can("guest", "media:delete")).toBe(false);
      expect(can("guest", "invitation:create")).toBe(false);
      expect(can("guest", "rsvp:view_all")).toBe(false);
    });
  });

  describe("Edge Cases & Null Safety", () => {
    it("returns false for undefined or null roles", () => {
      expect(can(undefined, "event:view")).toBe(false);
      expect(can(null, "event:view")).toBe(false);
    });
  });

  describe("Full Exhaustive Role × Action Matrix Consistency", () => {
    it("strictly matches the canonical PERMISSION_MATRIX for every combination", () => {
      ALL_ROLES.forEach((role) => {
        ALL_ACTIONS.forEach((action) => {
          const result = can(role, action);
          if (role === "super_admin") {
            expect(result).toBe(true);
          } else {
            const expected = PERMISSION_MATRIX[action]?.includes(role) ?? false;
            expect(result).toBe(expected);
          }
        });
      });
    });
  });
});

describe("Role Hierarchy & Helper Utilities", () => {
  it("enforces strict hierarchy ranking", () => {
    expect(ROLE_HIERARCHY.super_admin).toBeGreaterThan(ROLE_HIERARCHY.community_admin);
    expect(ROLE_HIERARCHY.community_admin).toBeGreaterThan(ROLE_HIERARCHY.event_organizer);
    expect(ROLE_HIERARCHY.event_organizer).toBeGreaterThan(ROLE_HIERARCHY.family_head);
    expect(ROLE_HIERARCHY.family_head).toBeGreaterThan(ROLE_HIERARCHY.member);
    expect(ROLE_HIERARCHY.member).toBeGreaterThan(ROLE_HIERARCHY.guest);
  });

  it("evaluates isAtLeastRole correctly", () => {
    expect(isAtLeastRole("community_admin", "member")).toBe(true);
    expect(isAtLeastRole("member", "community_admin")).toBe(false);
    expect(isAtLeastRole("family_head", "family_head")).toBe(true);
  });

  it("evaluates hasRole with super_admin bypass", () => {
    expect(hasRole("super_admin", ["member"])).toBe(true);
    expect(hasRole("community_admin", ["community_admin", "super_admin"])).toBe(true);
    expect(hasRole("member", ["community_admin"])).toBe(false);
    expect(hasRole(null, ["member"])).toBe(false);
  });

  it("returns visual styling for all roles", () => {
    ALL_ROLES.forEach((role) => {
      const badge = getRoleBadgeVariant(role);
      expect(badge).toHaveProperty("color");
      expect(badge).toHaveProperty("bgColor");
      expect(badge).toHaveProperty("borderColor");
    });
  });
});
