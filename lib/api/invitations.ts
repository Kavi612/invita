import {
  Invitation,
  InvitationRecipientType,
  InvitationStatus,
  Event,
  RSVPResponse,
} from "@/types";
import { isMockMode, ApiError } from "./client";
import { mockStore } from "./mock-store";

export interface BackendInvitationDto {
  id: string;
  event_id?: string;
  eventId?: string;
  event_title?: string;
  eventTitle?: string;
  invited_by_id?: string;
  invitedById?: string;
  recipient_type?: string;
  recipientType?: string;
  recipient_id?: string;
  recipientId?: string;
  recipient_name?: string;
  recipientName?: string;
  recipient_email?: string;
  recipientEmail?: string;
  recipient_phone?: string;
  recipientPhone?: string;
  invite_code?: string;
  inviteCode?: string;
  token?: string;
  channel?: "email" | "whatsapp" | "both";
  custom_message?: string;
  customMessage?: string;
  allowed_guests_count?: number;
  allowedGuestsCount?: number;
  status: string;
  sent_at?: string;
  sentAt?: string;
  opened_at?: string;
  openedAt?: string;
  responded_at?: string;
  respondedAt?: string;
  expires_at?: string;
  expiresAt?: string;
}

export function mapBackendInvitation(dto: BackendInvitationDto): Invitation {
  return {
    id: dto.id,
    eventId: dto.event_id || dto.eventId || "",
    eventTitle: dto.event_title || dto.eventTitle,
    invitedById: dto.invited_by_id || dto.invitedById || "",
    recipientType: (dto.recipient_type || dto.recipientType) as InvitationRecipientType,
    recipientId: dto.recipient_id || dto.recipientId || "",
    recipientName: dto.recipient_name || dto.recipientName || "",
    recipientEmail: dto.recipient_email || dto.recipientEmail,
    recipientPhone: dto.recipient_phone || dto.recipientPhone,
    inviteCode: dto.invite_code || dto.inviteCode || "",
    token: dto.token,
    channel: dto.channel,
    customMessage: dto.custom_message || dto.customMessage,
    allowedGuestsCount: dto.allowed_guests_count ?? dto.allowedGuestsCount ?? 1,
    status: (dto.status as InvitationStatus) || "sent",
    sentAt: dto.sent_at || dto.sentAt || new Date().toISOString(),
    openedAt: dto.opened_at || dto.openedAt,
    respondedAt: dto.responded_at || dto.respondedAt,
    expiresAt: dto.expires_at || dto.expiresAt,
  };
}

export const invitationsApi = {
  async list(eventId?: string): Promise<Invitation[]> {
    if (isMockMode()) {
      await mockStore.delay(200);
      if (!eventId) return [...mockStore.invitations];
      return mockStore.invitations.filter((i) => i.eventId === eventId);
    }
    throw new ApiError(
      "Missing endpoint documentation: GET /invitations. Please provide backend API docs.",
      501
    );
  },

  async getById(id: string): Promise<Invitation | undefined> {
    if (isMockMode()) {
      await mockStore.delay(150);
      return mockStore.invitations.find((i) => i.id === id);
    }
    throw new ApiError(
      `Missing endpoint documentation: GET /invitations/${id}. Please provide backend API docs.`,
      501
    );
  },

  async getByToken(token: string): Promise<{
    invitation: Invitation;
    event: Event;
    rsvpResponse?: RSVPResponse;
    isExpired: boolean;
  } | null> {
    if (isMockMode()) {
      await mockStore.delay(250);
      const inv = mockStore.invitations.find(
        (i) =>
          i.token === token ||
          (i.inviteCode && i.inviteCode.toLowerCase() === token.toLowerCase())
      );
      if (!inv) return null;

      const ev = mockStore.events.find((e) => e.id === inv.eventId);
      if (!ev) return null;

      const res = mockStore.rsvpResponses.find(
        (r) => r.token === token || r.invitationId === inv.id
      );

      let isExpired = false;
      if (inv.expiresAt && new Date(inv.expiresAt).getTime() < Date.now()) {
        isExpired = true;
      }

      return {
        invitation: { ...inv },
        event: { ...ev },
        rsvpResponse: res ? { ...res } : undefined,
        isExpired,
      };
    }

    // Public RSVP route: call without JWT
    throw new ApiError(
      `Missing endpoint documentation: GET /rsvp/${token}. Please provide backend API docs.`,
      501
    );
  },

  async create(
    data: Omit<Invitation, "id" | "status" | "sentAt">
  ): Promise<Invitation> {
    if (isMockMode()) {
      await mockStore.delay(250);
      const newInv: Invitation = {
        ...data,
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        status: "sent",
        token: `tok_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`,
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      mockStore.invitations.unshift(newInv);
      const ev = mockStore.events.find((e) => e.id === data.eventId);
      if (ev) {
        ev.guestStats.totalInvited += data.allowedGuestsCount || 1;
        ev.guestStats.pending += data.allowedGuestsCount || 1;
      }
      return newInv;
    }
    throw new ApiError(
      "Missing endpoint documentation: POST /invitations. Please provide backend API docs.",
      501
    );
  },

  async bulkCreate(
    items: Omit<Invitation, "id" | "status" | "sentAt">[]
  ): Promise<Invitation[]> {
    if (isMockMode()) {
      await mockStore.delay(400);
      const created: Invitation[] = items.map((data, idx) => ({
        ...data,
        id: `inv-${Date.now()}-${idx}`,
        status: "sent",
        token: `tok_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`,
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }));
      mockStore.invitations.unshift(...created);

      if (items.length > 0) {
        const ev = mockStore.events.find((e) => e.id === items[0].eventId);
        if (ev) {
          const addedGuests = items.reduce(
            (sum, item) => sum + (item.allowedGuestsCount || 1),
            0
          );
          ev.guestStats.totalInvited += addedGuests;
          ev.guestStats.pending += addedGuests;
        }
      }
      return created;
    }
    throw new ApiError(
      "Missing endpoint documentation: POST /invitations/bulk. Please provide backend API docs.",
      501
    );
  },

  async sendInvitations(
    eventId: string,
    options: {
      channel: "email" | "whatsapp" | "both";
      invitationIds?: string[];
    }
  ): Promise<{
    success: boolean;
    sentCount: number;
    updatedInvitations: Invitation[];
  }> {
    if (isMockMode()) {
      await mockStore.delay(600);
      const targets = mockStore.invitations.filter(
        (i) =>
          i.eventId === eventId &&
          (!options.invitationIds || options.invitationIds.includes(i.id))
      );

      targets.forEach((inv) => {
        if (!inv.token) {
          inv.token = `tok_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
        }
        inv.channel = options.channel;
        if (inv.status !== "responded") {
          inv.status = "sent";
        }
        inv.sentAt = new Date().toISOString();
        if (!inv.expiresAt) {
          inv.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }
      });

      return {
        success: true,
        sentCount: targets.length,
        updatedInvitations: targets.map((i) => ({ ...i })),
      };
    }
    throw new ApiError(
      `Missing endpoint documentation: POST /events/${eventId}/send-invitations. Please provide backend API docs.`,
      501
    );
  },

  async resendInvitation(invitationId: string): Promise<Invitation> {
    if (isMockMode()) {
      await mockStore.delay(300);
      const inv = mockStore.invitations.find((i) => i.id === invitationId);
      if (!inv) throw new ApiError("Invitation not found", 404);
      if (!inv.token) {
        inv.token = `tok_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
      }
      inv.sentAt = new Date().toISOString();
      if (inv.status !== "responded") {
        inv.status = "sent";
      }
      return { ...inv };
    }
    throw new ApiError(
      `Missing endpoint documentation: POST /invitations/${invitationId}/resend. Please provide backend API docs.`,
      501
    );
  },

  async sendRemindersToPending(
    eventId: string
  ): Promise<{ success: boolean; count: number }> {
    if (isMockMode()) {
      await mockStore.delay(500);
      const pendingInvs = mockStore.invitations.filter(
        (i) => i.eventId === eventId && i.status !== "responded"
      );
      pendingInvs.forEach((inv) => {
        if (!inv.token) {
          inv.token = `tok_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
        }
        inv.sentAt = new Date().toISOString();
        if (inv.status === "expired") {
          inv.status = "sent";
        }
      });
      return { success: true, count: pendingInvs.length };
    }
    throw new ApiError(
      `Missing endpoint documentation: POST /events/${eventId}/remind-pending. Please provide backend API docs.`,
      501
    );
  },

  async delete(id: string): Promise<boolean> {
    if (isMockMode()) {
      await mockStore.delay(200);
      mockStore.invitations = mockStore.invitations.filter((i) => i.id !== id);
      return true;
    }
    throw new ApiError(
      `Missing endpoint documentation: DELETE /invitations/${id}. Please provide backend API docs.`,
      501
    );
  },
};
