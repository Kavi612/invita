import { SubCommunity } from "@/types";
import { isMockMode, ApiError } from "./client";
import { mockStore } from "./mock-store";

export interface BackendSubCommunityDto {
  id: string;
  community_id?: string;
  communityId?: string;
  name: string;
  description: string;
  icon_name?: string;
  iconName?: string;
  member_ids?: string[];
  memberIds?: string[];
  created_by?: string;
  createdBy?: string;
  is_private?: boolean;
  isPrivate?: boolean;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export function mapBackendSubCommunity(dto: BackendSubCommunityDto): SubCommunity {
  return {
    id: dto.id,
    communityId: dto.community_id || dto.communityId || "",
    name: dto.name,
    description: dto.description || "",
    iconName: dto.icon_name || dto.iconName,
    memberIds: dto.member_ids || dto.memberIds || [],
    createdBy: dto.created_by || dto.createdBy || "",
    isPrivate: dto.is_private ?? dto.isPrivate ?? false,
    createdAt: dto.created_at || dto.createdAt || new Date().toISOString(),
    updatedAt: dto.updated_at || dto.updatedAt || new Date().toISOString(),
  };
}

export const subCommunitiesApi = {
  async list(communityId?: string): Promise<SubCommunity[]> {
    if (isMockMode()) {
      await mockStore.delay(250);
      if (!communityId) return [...mockStore.subCommunities];
      return mockStore.subCommunities.filter((s) => s.communityId === communityId);
    }
    throw new ApiError(
      "Missing endpoint documentation: GET /sub-communities. Please provide backend API docs.",
      501
    );
  },

  async getById(id: string): Promise<SubCommunity | undefined> {
    if (isMockMode()) {
      await mockStore.delay(150);
      return mockStore.subCommunities.find((s) => s.id === id);
    }
    throw new ApiError(
      `Missing endpoint documentation: GET /sub-communities/${id}. Please provide backend API docs.`,
      501
    );
  },

  async create(
    data: Omit<SubCommunity, "id" | "createdAt" | "updatedAt">
  ): Promise<SubCommunity> {
    if (isMockMode()) {
      await mockStore.delay(350);
      const newSub: SubCommunity = {
        ...data,
        id: `sub-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockStore.subCommunities.unshift(newSub);
      return newSub;
    }
    throw new ApiError(
      "Missing endpoint documentation: POST /sub-communities. Please provide backend API docs.",
      501
    );
  },

  async addMember(subCommunityId: string, memberId: string): Promise<SubCommunity> {
    if (isMockMode()) {
      await mockStore.delay(200);
      const sub = mockStore.subCommunities.find((s) => s.id === subCommunityId);
      if (!sub) throw new ApiError("Sub-community group not found", 404);
      if (!sub.memberIds.includes(memberId)) {
        sub.memberIds.push(memberId);
        sub.updatedAt = new Date().toISOString();
      }
      return { ...sub };
    }
    throw new ApiError(
      `Missing endpoint documentation: POST /sub-communities/${subCommunityId}/members. Please provide backend API docs.`,
      501
    );
  },

  async removeMember(subCommunityId: string, memberId: string): Promise<SubCommunity> {
    if (isMockMode()) {
      await mockStore.delay(200);
      const sub = mockStore.subCommunities.find((s) => s.id === subCommunityId);
      if (!sub) throw new ApiError("Sub-community group not found", 404);
      sub.memberIds = sub.memberIds.filter((id) => id !== memberId);
      sub.updatedAt = new Date().toISOString();
      return { ...sub };
    }
    throw new ApiError(
      `Missing endpoint documentation: DELETE /sub-communities/${subCommunityId}/members/${memberId}. Please provide backend API docs.`,
      501
    );
  },

  async delete(id: string): Promise<boolean> {
    if (isMockMode()) {
      await mockStore.delay(250);
      mockStore.subCommunities = mockStore.subCommunities.filter((s) => s.id !== id);
      return true;
    }
    throw new ApiError(
      `Missing endpoint documentation: DELETE /sub-communities/${id}. Please provide backend API docs.`,
      501
    );
  },
};
