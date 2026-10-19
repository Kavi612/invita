import { authApi } from "./auth";
import { communitiesApi } from "./communities";
import { familiesApi } from "./families";
import { membersApi } from "./members";
import { subCommunitiesApi } from "./subCommunities";
import { eventsApi } from "./events";
import { invitationsApi } from "./invitations";
import { rsvpsApi } from "./rsvps";
import { attendeesApi } from "./attendees";
import { mediaApi } from "./media";
import { remindersApi } from "./reminders";

export * from "./client";
export * from "./auth";
export * from "./communities";
export * from "./families";
export * from "./members";
export * from "./subCommunities";
export * from "./events";
export * from "./invitations";
export * from "./rsvps";
export * from "./attendees";
export * from "./media";
export * from "./reminders";
export * from "./mock-store";

export const api = {
  auth: authApi,
  communities: communitiesApi,
  families: familiesApi,
  members: membersApi,
  subCommunities: subCommunitiesApi,
  events: eventsApi,
  invitations: invitationsApi,
  rsvps: rsvpsApi,
  attendees: attendeesApi,
  media: mediaApi,
  reminders: remindersApi,
};

export default api;
