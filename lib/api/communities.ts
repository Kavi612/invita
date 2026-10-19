import { Community } from "@/types";
import { isMockMode, ApiError } from "./client";
import { mockStore } from "./mock-store";

export interface BackendCommunityDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  logoUrl?: string;
  banner_url?: string;
  bannerUrl?: string;
  admin_id?: string;
  adminId?: string;
  member_count?: number;
  memberCount?: number;
  event_count?: number;
  eventCount?: number;
  settings?: {
    is_private?: boolean;
    isPrivate?: boolean;
    allow_member_invites?: boolean;
    allowMemberInvites?: boolean;
    require_approval?: boolean;
    requireApproval?: boolean;
    default_currency?: string;
    defaultCurrency?: string;
    theme_color?: string;
    themeColor?: string;
  };
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export function mapBackendCommunity(dto: BackendCommunityDto): Community {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    description: dto.description,
    logoUrl: dto.logo_url || dto.logoUrl,
    bannerUrl: dto.banner_url || dto.bannerUrl,
    adminId: dto.admin_id || dto.adminId || "",
    memberCount: dto.member_count ?? dto.memberCount ?? 0,
    eventCount: dto.event_count ?? dto.eventCount ?? 0,
    settings: {
      isPrivate: dto.settings?.is_private ?? dto.settings?.isPrivate ?? false,
      allowMemberInvites: dto.settings?.allow_member_invites ?? dto.settings?.allowMemberInvites ?? true,
      requireApproval: dto.settings?.require_approval ?? dto.settings?.requireApproval ?? false,
      defaultCurrency: dto.settings?.default_currency || dto.settings?.defaultCurrency || "USD",
      themeColor: dto.settings?.theme_color || dto.settings?.themeColor || "emerald",
    },
    createdAt: dto.created_at || dto.createdAt || new Date().toISOString(),
    updatedAt: dto.updated_at || dto.updatedAt || new Date().toISOString(),
  };
}

export const communitiesApi = {
  async list(): Promise<Community[]> {
    if (isMockMode()) {
      await mockStore.delay(250);
      return [...mockStore.communities];
    }
    // Missing endpoint in docs
    throw new ApiError(
      "Missing endpoint documentation: GET /communities. Please provide backend API docs.",
      501
    );
  },

  async getById(id: string): Promise<Community | undefined> {
    if (isMockMode()) {
      await mockStore.delay(200);
      return mockStore.communities.find((c) => c.id === id);
    }
    // Missing endpoint in docs
    throw new ApiError(
      `Missing endpoint documentation: GET /communities/${id}. Please provide backend API docs.`,
      501
    );
  },

  async create(
    data: Omit<Community, "id" | "memberCount" | "eventCount" | "createdAt" | "updatedAt">
  ): Promise<Community> {
    if (isMockMode()) {
      await mockStore.delay(400);
      const newCommunity: Community = {
        ...data,
        id: `comm-${Date.now()}`,
        memberCount: 1,
        eventCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockStore.communities.unshift(newCommunity);
      return newCommunity;
    }
    // Missing endpoint in docs
    throw new ApiError(
      "Missing endpoint documentation: POST /communities. Please provide backend API docs.",
      501
    );
  },

  async update(id: string, data: Partial<Community>): Promise<Community> {
    if (isMockMode()) {
      await mockStore.delay(300);
      const index = mockStore.communities.findIndex((c) => c.id === id);
      if (index === -1) throw new ApiError("Community not found", 404);
      mockStore.communities[index] = {
        ...mockStore.communities[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return mockStore.communities[index];
    }
    // Missing endpoint in docs
    throw new ApiError(
      `Missing endpoint documentation: PATCH /communities/${id}. Please provide backend API docs.`,
      501
    );
  },
};
