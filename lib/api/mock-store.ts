import {
  mockCommunities as initialCommunities,
  mockEvents as initialEvents,
  mockFamilies as initialFamilies,
  mockInvitations as initialInvitations,
  mockMedia as initialMedia,
  mockMembers as initialMembers,
  mockReminderSettings as initialReminderSettings,
  mockRSVPs as initialRSVPs,
  mockRSVPResponses as initialRSVPResponses,
  mockSubCommunities as initialSubCommunities,
  mockUsers,
} from "@/lib/mock/data";

// In-memory mutable state for runtime mock interactions when NEXT_PUBLIC_USE_MOCKS=true
export const mockStore = {
  users: [...mockUsers],
  communities: [...initialCommunities],
  families: [...initialFamilies],
  members: [...initialMembers],
  subCommunities: [...initialSubCommunities],
  events: [...initialEvents],
  invitations: [...initialInvitations],
  rsvps: [...initialRSVPs],
  rsvpResponses: [...initialRSVPResponses],
  reminderSettings: [...initialReminderSettings],
  media: [...initialMedia],
  
  delay: (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms)),
};
