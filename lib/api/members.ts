import { Member, Role, RelationshipToHead, MemberStatus } from "@/types";
import { isMockMode, ApiError } from "./client";
import { mockStore } from "./mock-store";

export interface BackendMemberDto {
  id: string;
  user_id?: string;
  userId?: string;
  family_id?: string;
  familyId?: string;
  community_id?: string;
  communityId?: string;
  full_name?: string;
  fullName?: string;
  relationship_to_head?: string;
  relationshipToHead?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  avatarUrl?: string;
  date_of_birth?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  status?: string;
  role?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export function mapBackendMember(dto: BackendMemberDto): Member {
  return {
    id: dto.id,
    userId: dto.user_id || dto.userId,
    familyId: dto.family_id || dto.familyId,
    communityId: dto.community_id || dto.communityId || "",
    fullName: dto.full_name || dto.fullName || "",
    relationshipToHead: (dto.relationship_to_head || dto.relationshipToHead) as RelationshipToHead,
    email: dto.email,
    phone: dto.phone,
    avatarUrl:
      dto.avatar_url ||
      dto.avatarUrl ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    dateOfBirth: dto.date_of_birth || dto.dateOfBirth,
    gender: dto.gender,
    status: (dto.status as MemberStatus) || "active",
    role: (dto.role as Role) || "member",
    createdAt: dto.created_at || dto.createdAt || new Date().toISOString(),
    updatedAt: dto.updated_at || dto.updatedAt || new Date().toISOString(),
  };
}

export const membersApi = {
  async list(params?: { communityId?: string; familyId?: string }): Promise<Member[]> {
    if (isMockMode()) {
      await mockStore.delay(250);
      let res = [...mockStore.members];
      if (params?.communityId) {
        res = res.filter((m) => m.communityId === params.communityId);
      }
      if (params?.familyId) {
        res = res.filter((m) => m.familyId === params.familyId);
      }
      return res;
    }
    throw new ApiError(
      "Missing endpoint documentation: GET /members. Please provide backend API docs.",
      501
    );
  },

  async getById(id: string): Promise<Member | undefined> {
    if (isMockMode()) {
      await mockStore.delay(150);
      return mockStore.members.find((m) => m.id === id);
    }
    throw new ApiError(
      `Missing endpoint documentation: GET /members/${id}. Please provide backend API docs.`,
      501
    );
  },

  async create(
    data: Omit<Member, "id" | "createdAt" | "updatedAt">
  ): Promise<Member> {
    if (isMockMode()) {
      await mockStore.delay(350);
      const newMember: Member = {
        ...data,
        id: `mem-${Date.now()}`,
        avatarUrl:
          data.avatarUrl ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockStore.members.unshift(newMember);

      if (newMember.familyId) {
        const fam = mockStore.families.find((f) => f.id === newMember.familyId);
        if (fam) {
          fam.memberCount = (fam.memberCount || 0) + 1;
        }
      }

      return newMember;
    }
    throw new ApiError(
      "Missing endpoint documentation: POST /members. Please provide backend API docs.",
      501
    );
  },

  async update(id: string, data: Partial<Member>): Promise<Member> {
    if (isMockMode()) {
      await mockStore.delay(300);
      const index = mockStore.members.findIndex((m) => m.id === id);
      if (index === -1) throw new ApiError("Member not found", 404);
      mockStore.members[index] = {
        ...mockStore.members[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return mockStore.members[index];
    }
    throw new ApiError(
      `Missing endpoint documentation: PATCH /members/${id}. Please provide backend API docs.`,
      501
    );
  },

  async delete(id: string): Promise<boolean> {
    if (isMockMode()) {
      await mockStore.delay(250);
      const member = mockStore.members.find((m) => m.id === id);
      if (member?.familyId) {
        const fam = mockStore.families.find((f) => f.id === member.familyId);
        if (fam && fam.memberCount && fam.memberCount > 1) {
          fam.memberCount -= 1;
        }
      }
      mockStore.members = mockStore.members.filter((m) => m.id !== id);
      return true;
    }
    throw new ApiError(
      `Missing endpoint documentation: DELETE /members/${id}. Please provide backend API docs.`,
      501
    );
  },
};
