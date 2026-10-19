import { RSVP, RSVPResponse, RSVPStatus, Invitation } from "@/types";
import { isMockMode, ApiError } from "./client";
import { mockStore } from "./mock-store";

export interface BackendRsvpDto {
  id: string;
  invitation_id?: string;
  invitationId?: string;
  event_id?: string;
  eventId?: string;
  member_id?: string;
  memberId?: string;
  family_id?: string;
  familyId?: string;
  responder_name?: string;
  responderName?: string;
  responder_email?: string;
  responderEmail?: string;
  responder_phone?: string;
  responderPhone?: string;
  status: string;
  total_attending_count?: number;
  totalAttendingCount?: number;
  dietary_requirements?: string;
  dietaryRequirements?: string;
  notes?: string;
  responded_at?: string;
  respondedAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface BackendRsvpResponseDto {
  id: string;
  invitation_id?: string;
  invitationId?: string;
  token: string;
  event_id?: string;
  eventId?: string;
  status: "attending" | "declined" | "tentative";
  guest_count?: number;
  guestCount?: number;
  meal_preference?: string;
  mealPreference?: string;
  dietary_requirements?: string;
  dietaryRequirements?: string;
  notes?: string;
  responded_at?: string;
  respondedAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export function mapBackendRsvp(dto: BackendRsvpDto): RSVP {
  return {
    id: dto.id,
    invitationId: dto.invitation_id || dto.invitationId || "",
    eventId: dto.event_id || dto.eventId || "",
    memberId: dto.member_id || dto.memberId,
    familyId: dto.family_id || dto.familyId,
    responderName: dto.responder_name || dto.responderName || "",
    responderEmail: dto.responder_email || dto.responderEmail,
    responderPhone: dto.responder_phone || dto.responderPhone,
    status: (dto.status as RSVPStatus) || "attending",
    totalAttendingCount: dto.total_attending_count ?? dto.totalAttendingCount ?? 0,
    dietaryRequirements: dto.dietary_requirements || dto.dietaryRequirements,
    notes: dto.notes,
    respondedAt: dto.responded_at || dto.respondedAt || new Date().toISOString(),
    updatedAt: dto.updated_at || dto.updatedAt || new Date().toISOString(),
  };
}

export function mapBackendRsvpResponse(dto: BackendRsvpResponseDto): RSVPResponse {
  return {
    id: dto.id,
    invitationId: dto.invitation_id || dto.invitationId || "",
    token: dto.token,
    eventId: dto.event_id || dto.eventId || "",
    status: dto.status,
    guestCount: dto.guest_count ?? dto.guestCount ?? 0,
    mealPreference: dto.meal_preference || dto.mealPreference,
    dietaryRequirements: dto.dietary_requirements || dto.dietaryRequirements,
    notes: dto.notes,
    respondedAt: dto.responded_at || dto.respondedAt || new Date().toISOString(),
    updatedAt: dto.updated_at || dto.updatedAt || new Date().toISOString(),
  };
}

export const rsvpsApi = {
  async list(eventId?: string): Promise<RSVP[]> {
    if (isMockMode()) {
      await mockStore.delay(200);
      if (!eventId) return [...mockStore.rsvps];
      return mockStore.rsvps.filter((r) => r.eventId === eventId);
    }
    throw new ApiError(
      "Missing endpoint documentation: GET /rsvps. Please provide backend API docs.",
      501
    );
  },

  async listResponses(eventId?: string): Promise<RSVPResponse[]> {
    if (isMockMode()) {
      await mockStore.delay(150);
      if (!eventId) return [...mockStore.rsvpResponses];
      return mockStore.rsvpResponses.filter((r) => r.eventId === eventId);
    }
    throw new ApiError(
      "Missing endpoint documentation: GET /rsvp-responses. Please provide backend API docs.",
      501
    );
  },

  async submitRsvp(
    token: string,
    data: {
      status: "attending" | "declined";
      guestCount: number;
      mealPreference?: string;
      dietaryRequirements?: string;
      notes?: string;
    }
  ): Promise<{
    success: boolean;
    invitation: Invitation;
    rsvpResponse: RSVPResponse;
  }> {
    if (isMockMode()) {
      await mockStore.delay(400);
      const invIndex = mockStore.invitations.findIndex(
        (i) =>
          i.token === token ||
          (i.inviteCode && i.inviteCode.toLowerCase() === token.toLowerCase())
      );
      if (invIndex === -1) {
        throw new ApiError("Invitation not found for the provided token.", 404);
      }

      const inv = mockStore.invitations[invIndex];
      const ev = mockStore.events.find((e) => e.id === inv.eventId);

      if (inv.expiresAt && new Date(inv.expiresAt).getTime() < Date.now()) {
        throw new ApiError("This invitation has expired and can no longer be updated.", 410);
      }

      const existingResIndex = mockStore.rsvpResponses.findIndex(
        (r) => r.token === token || r.invitationId === inv.id
      );

      const wasAttending =
        existingResIndex !== -1 && mockStore.rsvpResponses[existingResIndex].status === "attending";
      const previousGuestCount =
        existingResIndex !== -1 ? mockStore.rsvpResponses[existingResIndex].guestCount : 0;

      const rsvpResponse: RSVPResponse = {
        id:
          existingResIndex !== -1
            ? mockStore.rsvpResponses[existingResIndex].id
            : `res-${Date.now()}`,
        invitationId: inv.id,
        token: inv.token || token,
        eventId: inv.eventId,
        status: data.status,
        guestCount: data.status === "attending" ? data.guestCount : 0,
        mealPreference: data.mealPreference,
        dietaryRequirements: data.dietaryRequirements,
        notes: data.notes,
        respondedAt:
          existingResIndex !== -1
            ? mockStore.rsvpResponses[existingResIndex].respondedAt
            : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingResIndex !== -1) {
        mockStore.rsvpResponses[existingResIndex] = rsvpResponse;
      } else {
        mockStore.rsvpResponses.unshift(rsvpResponse);
      }

      // Update invitation status
      inv.status = "responded";
      inv.respondedAt = new Date().toISOString();

      // Update or add RSVP record
      const existingRsvpIndex = mockStore.rsvps.findIndex((r) => r.invitationId === inv.id);
      const rsvpObj: RSVP = {
        id:
          existingRsvpIndex !== -1 ? mockStore.rsvps[existingRsvpIndex].id : `rsvp-${Date.now()}`,
        invitationId: inv.id,
        eventId: inv.eventId,
        responderName: inv.recipientName,
        responderEmail: inv.recipientEmail,
        responderPhone: inv.recipientPhone,
        status: data.status,
        totalAttendingCount: data.status === "attending" ? data.guestCount : 0,
        dietaryRequirements: data.dietaryRequirements,
        notes: data.notes,
        respondedAt: rsvpResponse.respondedAt,
        updatedAt: rsvpResponse.updatedAt,
      };

      if (existingRsvpIndex !== -1) {
        mockStore.rsvps[existingRsvpIndex] = rsvpObj;
      } else {
        mockStore.rsvps.unshift(rsvpObj);
      }

      // Update event statistics
      if (ev) {
        if (existingResIndex === -1) {
          ev.guestStats.pending = Math.max(0, ev.guestStats.pending - inv.allowedGuestsCount);
          if (data.status === "attending") {
            ev.guestStats.attending += data.guestCount;
          } else {
            ev.guestStats.declined += inv.allowedGuestsCount;
          }
        } else {
          if (wasAttending && data.status === "attending") {
            ev.guestStats.attending += data.guestCount - previousGuestCount;
          } else if (wasAttending && data.status === "declined") {
            ev.guestStats.attending = Math.max(0, ev.guestStats.attending - previousGuestCount);
            ev.guestStats.declined += inv.allowedGuestsCount;
          } else if (!wasAttending && data.status === "attending") {
            ev.guestStats.declined = Math.max(0, ev.guestStats.declined - inv.allowedGuestsCount);
            ev.guestStats.attending += data.guestCount;
          }
        }
      }

      return {
        success: true,
        invitation: { ...inv },
        rsvpResponse: { ...rsvpResponse },
      };
    }

    // Public RSVP submission endpoint
    throw new ApiError(
      `Missing endpoint documentation: POST /rsvp/${token}. Please provide backend API docs.`,
      501
    );
  },
};
