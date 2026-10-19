import { isMockMode, ApiError } from "./client";
import { mockStore } from "./mock-store";

export interface AttendeeItem {
  id: string;
  invitationId: string;
  name: string;
  email?: string;
  phone?: string;
  familyId?: string;
  familyName?: string;
  status: "accepted" | "declined" | "pending";
  guestCount: number;
  allowedGuestsCount: number;
  mealPreference?: string;
  dietaryRequirements?: string;
  notes?: string;
  respondedAt?: string;
}

export interface AttendeeSummary {
  totalInvited: number;
  accepted: number;
  declined: number;
  pending: number;
  totalHeadcount: number;
  mealBreakdown: Record<string, number>;
}

export interface BackendAttendeeDto {
  id: string;
  invitation_id?: string;
  invitationId?: string;
  name: string;
  email?: string;
  phone?: string;
  family_id?: string;
  familyId?: string;
  family_name?: string;
  familyName?: string;
  status: string;
  guest_count?: number;
  guestCount?: number;
  allowed_guests_count?: number;
  allowedGuestsCount?: number;
  meal_preference?: string;
  mealPreference?: string;
  dietary_requirements?: string;
  dietaryRequirements?: string;
  notes?: string;
  responded_at?: string;
  respondedAt?: string;
}

export function mapBackendAttendee(dto: BackendAttendeeDto): AttendeeItem {
  let status: "accepted" | "declined" | "pending" = "pending";
  if (dto.status === "attending" || dto.status === "accepted") status = "accepted";
  else if (dto.status === "declined") status = "declined";

  return {
    id: dto.id,
    invitationId: dto.invitation_id || dto.invitationId || dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    familyId: dto.family_id || dto.familyId,
    familyName: dto.family_name || dto.familyName,
    status,
    guestCount: dto.guest_count ?? dto.guestCount ?? (status === "accepted" ? 1 : 0),
    allowedGuestsCount: dto.allowed_guests_count ?? dto.allowedGuestsCount ?? 1,
    mealPreference: dto.meal_preference || dto.mealPreference,
    dietaryRequirements: dto.dietary_requirements || dto.dietaryRequirements,
    notes: dto.notes,
    respondedAt: dto.responded_at || dto.respondedAt,
  };
}

export const attendeesApi = {
  async list(
    eventId: string,
    filters?: {
      status?: string;
      search?: string;
      familyId?: string;
    }
  ): Promise<AttendeeItem[]> {
    if (isMockMode()) {
      await mockStore.delay(200);
      const invs = mockStore.invitations.filter((i) => i.eventId === eventId);
      const responses = mockStore.rsvpResponses.filter((r) => r.eventId === eventId);

      const items: AttendeeItem[] = invs.map((inv) => {
        const res = responses.find((r) => r.invitationId === inv.id || r.token === inv.token);
        const fam = inv.recipientType === "family"
          ? mockStore.families.find((f) => f.id === inv.recipientId)
          : undefined;

        let status: "accepted" | "declined" | "pending" = "pending";
        if (res) {
          status = res.status === "attending" ? "accepted" : "declined";
        }

        return {
          id: inv.id,
          invitationId: inv.id,
          name: inv.recipientName,
          email: inv.recipientEmail,
          phone: inv.recipientPhone,
          familyId: fam?.id,
          familyName: fam?.familyName,
          status,
          guestCount: res ? res.guestCount : 0,
          allowedGuestsCount: inv.allowedGuestsCount || 1,
          mealPreference: res?.mealPreference,
          dietaryRequirements: res?.dietaryRequirements,
          notes: res?.notes,
          respondedAt: res?.respondedAt,
        };
      });

      let filtered = items;
      if (filters?.status && filters.status !== "all") {
        filtered = filtered.filter((a) => a.status === filters.status);
      }
      if (filters?.familyId) {
        filtered = filtered.filter((a) => a.familyId === filters.familyId);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.email?.toLowerCase().includes(q) ||
            a.familyName?.toLowerCase().includes(q)
        );
      }
      return filtered;
    }

    throw new ApiError(
      `Missing endpoint documentation: GET /events/${eventId}/attendees. Please provide backend API docs.`,
      501
    );
  },

  async getSummary(eventId: string): Promise<AttendeeSummary> {
    if (isMockMode()) {
      const list = await attendeesApi.list(eventId);
      const totalInvited = list.length;
      const accepted = list.filter((a) => a.status === "accepted").length;
      const declined = list.filter((a) => a.status === "declined").length;
      const pending = list.filter((a) => a.status === "pending").length;
      const totalHeadcount = list
        .filter((a) => a.status === "accepted")
        .reduce((sum, a) => sum + (a.guestCount || 1), 0);

      const mealBreakdown: Record<string, number> = {};
      list
        .filter((a) => a.status === "accepted" && a.mealPreference)
        .forEach((a) => {
          const pref = a.mealPreference || "Standard";
          mealBreakdown[pref] = (mealBreakdown[pref] || 0) + 1;
        });

      return {
        totalInvited,
        accepted,
        declined,
        pending,
        totalHeadcount,
        mealBreakdown,
      };
    }

    throw new ApiError(
      `Missing endpoint documentation: GET /events/${eventId}/attendees/summary. Please provide backend API docs.`,
      501
    );
  },
};
