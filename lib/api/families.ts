import { Family } from "@/types";
import { isMockMode, ApiError } from "./client";
import { mockStore } from "./mock-store";

export interface BackendFamilyDto {
  id: string;
  community_id?: string;
  communityId?: string;
  family_name?: string;
  familyName?: string;
  head_of_family_id?: string;
  headOfFamilyId?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  member_count?: number;
  memberCount?: number;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export function mapBackendFamily(dto: BackendFamilyDto): Family {
  return {
    id: dto.id,
    communityId: dto.community_id || dto.communityId || "",
    familyName: dto.family_name || dto.familyName || "",
    headOfFamilyId: dto.head_of_family_id || dto.headOfFamilyId || "",
    address: dto.address,
    city: dto.city,
    state: dto.state,
    phone: dto.phone,
    memberCount: dto.member_count ?? dto.memberCount ?? 1,
    createdAt: dto.created_at || dto.createdAt || new Date().toISOString(),
    updatedAt: dto.updated_at || dto.updatedAt || new Date().toISOString(),
  };
}

export const familiesApi = {
  async list(communityId?: string): Promise<Family[]> {
    if (isMockMode()) {
      await mockStore.delay(250);
      if (!communityId) return [...mockStore.families];
      return mockStore.families.filter((f) => f.communityId === communityId);
    }
    throw new ApiError(
      "Missing endpoint documentation: GET /families. Please provide backend API docs.",
      501
    );
  },

  async getById(id: string): Promise<Family | undefined> {
    if (isMockMode()) {
      await mockStore.delay(150);
      return mockStore.families.find((f) => f.id === id);
    }
    throw new ApiError(
      `Missing endpoint documentation: GET /families/${id}. Please provide backend API docs.`,
      501
    );
  },

  async create(
    data: Omit<Family, "id" | "memberCount" | "createdAt" | "updatedAt">
  ): Promise<Family> {
    if (isMockMode()) {
      await mockStore.delay(350);
      const newFamily: Family = {
        ...data,
        id: `fam-${Date.now()}`,
        memberCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockStore.families.unshift(newFamily);
      return newFamily;
    }
    throw new ApiError(
      "Missing endpoint documentation: POST /families. Please provide backend API docs.",
      501
    );
  },

  async update(id: string, data: Partial<Family>): Promise<Family> {
    if (isMockMode()) {
      await mockStore.delay(300);
      const index = mockStore.families.findIndex((f) => f.id === id);
      if (index === -1) throw new ApiError("Family not found", 404);
      mockStore.families[index] = {
        ...mockStore.families[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return mockStore.families[index];
    }
    throw new ApiError(
      `Missing endpoint documentation: PATCH /families/${id}. Please provide backend API docs.`,
      501
    );
  },

  async delete(id: string): Promise<boolean> {
    if (isMockMode()) {
      await mockStore.delay(250);
      mockStore.families = mockStore.families.filter((f) => f.id !== id);
      return true;
    }
    throw new ApiError(
      `Missing endpoint documentation: DELETE /families/${id}. Please provide backend API docs.`,
      501
    );
  },
};
