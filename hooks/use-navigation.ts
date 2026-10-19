import { Role } from "@/types";

export interface NavLinkItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string | number;
  roles?: Role[]; // undefined means all roles
  description?: string;
}

export interface NavSection {
  title: string;
  items: NavLinkItem[];
}

export const ALL_NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        iconName: "LayoutDashboard",
        description: "Activity feed, upcoming milestones, and quick metrics",
      },
    ],
  },
  {
    title: "Community & Registry",
    items: [
      {
        title: "Communities",
        href: "/communities",
        iconName: "Building2",
        roles: ["super_admin"],
        badge: "2",
        description: "Multi-community management and creation",
      },
      {
        title: "Members Directory",
        href: "/members",
        iconName: "Users",
        roles: ["super_admin", "community_admin", "event_organizer", "family_head", "member"],
        description: "Member profiles, relationships, and directory",
      },
      {
        title: "Family Registry",
        href: "/families",
        iconName: "Home",
        roles: ["super_admin", "community_admin", "family_head"],
        description: "Households, lineage, and family representation",
      },
    ],
  },
  {
    title: "Events & Celebrations",
    items: [
      {
        title: "Events",
        href: "/events",
        iconName: "CalendarDays",
        badge: "3",
        description: "Browse, plan, and RSVP to upcoming gatherings",
      },
      {
        title: "Invitations Hub",
        href: "/invitations",
        iconName: "MailOpen",
        roles: ["super_admin", "community_admin", "event_organizer", "family_head", "member", "guest"],
        description: "Digital invites, QR codes, and tracking",
      },
      {
        title: "RSVP Management",
        href: "/rsvps",
        iconName: "UserCheck",
        roles: ["super_admin", "community_admin", "event_organizer", "family_head"],
        description: "Attendee headcount, meal preferences, and logistics",
      },
    ],
  },
  {
    title: "Media & Memories",
    items: [
      {
        title: "Media Gallery",
        href: "/media",
        iconName: "Image",
        roles: ["super_admin", "community_admin", "event_organizer", "family_head", "member"],
        description: "Celebration albums, programs, and shared media",
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "Community Settings",
        href: "/settings/community",
        iconName: "SlidersHorizontal",
        roles: ["super_admin", "community_admin"],
        description: "Branding, privacy, and approval requirements",
      },
      {
        title: "Platform Governance",
        href: "/settings/system",
        iconName: "ShieldAlert",
        roles: ["super_admin"],
        description: "Global controls, audits, and security",
      },
    ],
  },
];

export function getNavigationForRole(role?: Role | null): NavSection[] {
  const activeRole = role || "guest";
  return ALL_NAVIGATION_SECTIONS.map((section) => {
    const filteredItems = section.items.filter((item) => {
      if (!item.roles) return true;
      if (activeRole === "super_admin") return true;
      return item.roles.includes(activeRole);
    });

    return {
      title: section.title,
      items: filteredItems,
    };
  }).filter((section) => section.items.length > 0);
}
