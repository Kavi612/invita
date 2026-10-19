import { User, Role } from "@/types";
import { isMockMode, ApiError } from "./client";
import { mockStore } from "./mock-store";

// Backend contract DTO representation
export interface BackendUserDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  avatarUrl?: string;
  role: string;
  community_id?: string;
  communityId?: string;
  family_id?: string;
  familyId?: string;
  bio?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

// Module Mapper: maps backend user DTO to frontend User model
export function mapBackendUser(dto: BackendUserDto): User {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    avatarUrl: dto.avatar_url || dto.avatarUrl,
    role: (dto.role as Role) || "member",
    communityId: dto.community_id || dto.communityId,
    familyId: dto.family_id || dto.familyId,
    bio: dto.bio,
    createdAt: dto.created_at || dto.createdAt || new Date().toISOString(),
    updatedAt: dto.updated_at || dto.updatedAt || new Date().toISOString(),
  };
}

export const authApi = {
  async getCurrentUser(userId?: string): Promise<User> {
    if (isMockMode()) {
      await mockStore.delay(150);
      return mockStore.users.find((u) => u.id === userId) || mockStore.users[0];
    }
    // Endpoint missing in provided backend docs
    throw new ApiError(
      "Missing endpoint documentation: GET /auth/me or GET /auth/users/:id. Please provide backend API docs.",
      501
    );
  },

  async listAvailableUsers(): Promise<User[]> {
    if (isMockMode()) {
      await mockStore.delay(100);
      return mockStore.users;
    }
    // Endpoint missing in provided backend docs
    throw new ApiError(
      "Missing endpoint documentation: GET /auth/users. Please provide backend API docs.",
      501
    );
  },
};
