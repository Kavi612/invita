export type Role =
  | "super_admin"
  | "community_admin"
  | "event_organizer"
  | "family_head"
  | "member"
  | "guest";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: Role;
  communityId?: string;
  familyId?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunitySettings {
  isPrivate: boolean;
  allowMemberInvites: boolean;
  requireApproval: boolean;
  defaultCurrency?: string;
  themeColor?: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  adminId: string;
  memberCount: number;
  eventCount: number;
  settings: CommunitySettings;
  createdAt: string;
  updatedAt: string;
}

export interface SubCommunity {
  id: string;
  communityId: string;
  name: string;
  description: string;
  iconName?: string;
  memberIds: string[];
  createdBy: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}


export interface Family {
  id: string;
  communityId: string;
  familyName: string;
  headOfFamilyId: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type RelationshipToHead =
  | "head"
  | "spouse"
  | "child"
  | "parent"
  | "sibling"
  | "relative"
  | "other";

export type MemberStatus = "active" | "invited" | "pending" | "suspended";

export interface Member {
  id: string;
  userId?: string;
  familyId?: string;
  communityId: string;
  fullName: string;
  relationshipToHead?: RelationshipToHead;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  status: MemberStatus;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export type EventType =
  | "wedding"
  | "anniversary"
  | "birthday"
  | "reunion"
  | "cultural"
  | "religious"
  | "conference"
  | "social";

export type EventStatus =
  | "draft"
  | "published"
  | "ongoing"
  | "completed"
  | "cancelled";

export interface EventLocation {
  name: string;
  address: string;
  city?: string;
  mapUrl?: string;
  isVirtual?: boolean;
  meetingUrl?: string;
}

export interface EventGuestStats {
  totalInvited: number;
  attending: number;
  declined: number;
  tentative: number;
  pending: number;
}

export type StreamStatus = "upcoming" | "live" | "ended";

export interface StreamConfig {
  url?: string;
  embedUrl?: string;
  isEnabled: boolean;
  title?: string;
  platform?: "youtube" | "vimeo" | "custom";
}

export type EventVisibility = "public" | "community" | "sub_community" | "private";

export interface Event {
  id: string;
  communityId: string;
  title: string;
  description: string;
  type: EventType;
  startDate: string;
  endDate: string;
  location: EventLocation;
  coverImage?: string;
  organizerId: string;
  organizerName?: string;
  status: EventStatus;
  visibility?: EventVisibility;
  rsvpDeadline?: string;
  maxAttendees?: number;
  guestStats: EventGuestStats;
  streamConfig?: StreamConfig;
  createdAt: string;
  updatedAt: string;
}

export type InvitationRecipientType =
  | "individual"
  | "family"
  | "sub_community"
  | "outside_guest";

export type InvitationStatus =
  | "sent"
  | "delivered"
  | "opened"
  | "responded"
  | "expired";

export interface Invitation {
  id: string;
  eventId: string;
  eventTitle?: string;
  invitedById: string;
  recipientType: InvitationRecipientType;
  recipientId: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  inviteCode: string;
  token?: string; // Unique URL token for public RSVP access
  channel?: "email" | "whatsapp" | "both";
  customMessage?: string;
  allowedGuestsCount: number;
  status: InvitationStatus;
  sentAt: string;
  openedAt?: string;
  respondedAt?: string;
  expiresAt?: string;
}

export type RSVPStatus = "attending" | "declined" | "tentative" | "waitlisted";

export interface AdditionalGuest {
  name: string;
  ageGroup?: "adult" | "child" | "infant";
  mealPreference?: string;
}

export interface RSVP {
  id: string;
  invitationId: string;
  eventId: string;
  memberId?: string;
  familyId?: string;
  responderName: string;
  responderEmail?: string;
  responderPhone?: string;
  status: RSVPStatus;
  totalAttendingCount: number;
  additionalGuests?: AdditionalGuest[];
  dietaryRequirements?: string;
  notes?: string;
  respondedAt: string;
  updatedAt: string;
}

export interface RSVPResponse {
  id: string;
  invitationId: string;
  token: string;
  eventId: string;
  status: "attending" | "declined" | "tentative";
  guestCount: number;
  mealPreference?: string;
  dietaryRequirements?: string;
  notes?: string;
  respondedAt: string;
  updatedAt: string;
}

export type ReminderType = "after_rsvp" | "before_event" | "on_change";

export interface ReminderSetting {
  id: string;
  eventId: string;
  type: ReminderType;
  title: string;
  timing: string;
  enabled: boolean;
  channel: "email" | "whatsapp" | "both";
  description?: string;
}

export type MediaType = "image" | "video" | "document" | "audio";

export interface Media {
  id: string;
  communityId: string;
  eventId?: string;
  uploaderId: string;
  uploaderName?: string;
  title?: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  mediaType: MediaType;
  fileSize: number;
  mimeType: string;
  tags?: string[];
  uploadedAt: string;
}

export type NavigationItem = {
  title: string;
  href: string;
  iconName: string;
  badge?: string | number;
  requiredRoles?: Role[];
  section?: "main" | "community" | "events" | "management" | "system";
};
