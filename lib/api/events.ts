import { Event, EventType, EventStatus, EventVisibility, StreamConfig } from "@/types";
import { isMockMode, ApiError } from "./client";
import { mockStore } from "./mock-store";

export interface BackendEventDto {
  id: string;
  community_id?: string;
  communityId?: string;
  title: string;
  description: string;
  type: string;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  location?: {
    name: string;
    address: string;
    city?: string;
    map_url?: string;
    mapUrl?: string;
    is_virtual?: boolean;
    isVirtual?: boolean;
    meeting_url?: string;
    meetingUrl?: string;
  };
  cover_image?: string;
  coverImage?: string;
  organizer_id?: string;
  organizerId?: string;
  organizer_name?: string;
  organizerName?: string;
  status: string;
  visibility?: string;
  rsvp_deadline?: string;
  rsvpDeadline?: string;
  max_attendees?: number;
  maxAttendees?: number;
  guest_stats?: {
    total_invited?: number;
    totalInvited?: number;
    attending?: number;
    declined?: number;
    tentative?: number;
    pending?: number;
  };
  guestStats?: {
    totalInvited: number;
    attending: number;
    declined: number;
    tentative: number;
    pending: number;
  };
  stream_config?: {
    url?: string;
    embed_url?: string;
    embedUrl?: string;
    is_enabled?: boolean;
    isEnabled?: boolean;
    title?: string;
    platform?: "youtube" | "vimeo" | "custom";
  };
  streamConfig?: StreamConfig;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export function mapBackendEvent(dto: BackendEventDto): Event {
  return {
    id: dto.id,
    communityId: dto.community_id || dto.communityId || "",
    title: dto.title,
    description: dto.description || "",
    type: (dto.type as EventType) || "social",
    startDate: dto.start_date || dto.startDate || new Date().toISOString(),
    endDate: dto.end_date || dto.endDate || new Date().toISOString(),
    location: {
      name: dto.location?.name || "Venue",
      address: dto.location?.address || "Address pending",
      city: dto.location?.city,
      mapUrl: dto.location?.map_url || dto.location?.mapUrl,
      isVirtual: dto.location?.is_virtual ?? dto.location?.isVirtual ?? false,
      meetingUrl: dto.location?.meeting_url || dto.location?.meetingUrl,
    },
    coverImage: dto.cover_image || dto.coverImage,
    organizerId: dto.organizer_id || dto.organizerId || "",
    organizerName: dto.organizer_name || dto.organizerName,
    status: (dto.status as EventStatus) || "draft",
    visibility: (dto.visibility as EventVisibility) || "community",
    rsvpDeadline: dto.rsvp_deadline || dto.rsvpDeadline,
    maxAttendees: dto.max_attendees ?? dto.maxAttendees,
    guestStats: {
      totalInvited:
        dto.guest_stats?.total_invited ??
        dto.guest_stats?.totalInvited ??
        dto.guestStats?.totalInvited ??
        0,
      attending:
        dto.guest_stats?.attending ??
        dto.guestStats?.attending ??
        0,
      declined:
        dto.guest_stats?.declined ??
        dto.guestStats?.declined ??
        0,
      tentative:
        dto.guest_stats?.tentative ??
        dto.guestStats?.tentative ??
        0,
      pending:
        dto.guest_stats?.pending ??
        dto.guestStats?.pending ??
        0,
    },
    streamConfig: dto.stream_config
      ? {
          url: dto.stream_config.url,
          embedUrl: dto.stream_config.embed_url || dto.stream_config.embedUrl,
          isEnabled: dto.stream_config.is_enabled ?? dto.stream_config.isEnabled ?? false,
          title: dto.stream_config.title,
          platform: dto.stream_config.platform,
        }
      : dto.streamConfig,
    createdAt: dto.created_at || dto.createdAt || new Date().toISOString(),
    updatedAt: dto.updated_at || dto.updatedAt || new Date().toISOString(),
  };
}

export const eventsApi = {
  async list(communityId?: string): Promise<Event[]> {
    if (isMockMode()) {
      await mockStore.delay(250);
      if (!communityId) return [...mockStore.events];
      return mockStore.events.filter((e) => e.communityId === communityId);
    }
    throw new ApiError(
      "Missing endpoint documentation: GET /events. Please provide backend API docs.",
      501
    );
  },

  async getById(id: string): Promise<Event | undefined> {
    if (isMockMode()) {
      await mockStore.delay(150);
      return mockStore.events.find((e) => e.id === id);
    }
    throw new ApiError(
      `Missing endpoint documentation: GET /events/${id}. Please provide backend API docs.`,
      501
    );
  },

  async create(
    data: Omit<Event, "id" | "guestStats" | "createdAt" | "updatedAt">
  ): Promise<Event> {
    if (isMockMode()) {
      await mockStore.delay(350);
      const newEvent: Event = {
        ...data,
        id: `evt-${Date.now()}`,
        guestStats: {
          totalInvited: 0,
          attending: 0,
          declined: 0,
          tentative: 0,
          pending: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockStore.events.unshift(newEvent);
      return newEvent;
    }
    throw new ApiError(
      "Missing endpoint documentation: POST /events. Please provide backend API docs.",
      501
    );
  },

  async update(id: string, data: Partial<Event>): Promise<Event> {
    if (isMockMode()) {
      await mockStore.delay(300);
      const index = mockStore.events.findIndex((e) => e.id === id);
      if (index === -1) throw new ApiError("Event not found", 404);
      mockStore.events[index] = {
        ...mockStore.events[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return mockStore.events[index];
    }
    throw new ApiError(
      `Missing endpoint documentation: PATCH /events/${id}. Please provide backend API docs.`,
      501
    );
  },

  async updateStreamConfig(
    eventId: string,
    streamConfig: StreamConfig
  ): Promise<Event> {
    if (isMockMode()) {
      await mockStore.delay(300);
      const ev = mockStore.events.find((e) => e.id === eventId);
      if (!ev) throw new ApiError("Event not found", 404);
      ev.streamConfig = streamConfig;
      ev.updatedAt = new Date().toISOString();
      return { ...ev };
    }
    throw new ApiError(
      `Missing endpoint documentation: PUT /events/${eventId}/stream. Please provide backend API docs.`,
      501
    );
  },

  async delete(id: string): Promise<boolean> {
    if (isMockMode()) {
      await mockStore.delay(250);
      mockStore.events = mockStore.events.filter((e) => e.id !== id);
      mockStore.invitations = mockStore.invitations.filter((i) => i.eventId !== id);
      return true;
    }
    throw new ApiError(
      `Missing endpoint documentation: DELETE /events/${id}. Please provide backend API docs.`,
      501
    );
  },
};
