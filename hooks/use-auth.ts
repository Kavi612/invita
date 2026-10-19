import { create } from "zustand";
import { mockCommunities, mockUsers } from "@/lib/mock/data";
import { Role, User } from "@/types";

interface AuthState {
  currentUser: User | null;
  currentRole: Role | null;
  token: string | null;
  isAuthenticated: boolean;
  activeCommunityId: string;
  availableUsers: User[];
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  mockLoginAsRole: (role: Role) => void;
  switchUser: (userId: string) => void;
  switchRole: (role: Role) => void;
  setActiveCommunityId: (communityId: string) => void;
  logout: () => void;
}

// Helpers for client-side cookies
function setAuthCookies(token: string, role: Role) {
  if (typeof document !== "undefined") {
    document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `auth_role=${role}; path=/; max-age=604800; SameSite=Lax`;
  }
}

function clearAuthCookies() {
  if (typeof document !== "undefined") {
    document.cookie = "auth_token=; path=/; max-age=0";
    document.cookie = "auth_role=; path=/; max-age=0";
  }
}

function getInitialAuth(): { user: User; role: Role; token: string } {
  // Default to Marcus Vance (community_admin) for testing
  const defaultUser = mockUsers[1]; // Marcus Vance
  const defaultRole = defaultUser.role;
  const defaultToken = `mock_token_${defaultUser.id}_${Date.now()}`;

  if (typeof window !== "undefined") {
    try {
      const storedToken = localStorage.getItem("invita_token");
      const storedUserId = localStorage.getItem("invita_user_id");
      if (storedToken && storedUserId) {
        const found = mockUsers.find((u) => u.id === storedUserId);
        if (found) {
          setAuthCookies(storedToken, found.role);
          return { user: found, role: found.role, token: storedToken };
        }
      }
    } catch {
      // fallback to default
    }
    setAuthCookies(defaultToken, defaultRole);
  }

  return { user: defaultUser, role: defaultRole, token: defaultToken };
}

const initial = getInitialAuth();

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: initial.user,
  currentRole: initial.role,
  token: initial.token,
  isAuthenticated: true,
  activeCommunityId: initial.user.communityId || mockCommunities[0].id,
  availableUsers: mockUsers,

  login: async (email: string, password?: string) => {
    // Simulate brief network latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    const normalizedEmail = email.trim().toLowerCase();
    const user = mockUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return {
        success: false,
        error: "No account found with this email. Try marcus.v@heritagehills.org or use Quick Role Login below.",
      };
    }

    if (password && password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long.",
      };
    }

    const token = `invita_jwt_${user.id}_${Date.now()}`;
    setAuthCookies(token, user.role);

    if (typeof window !== "undefined") {
      localStorage.setItem("invita_token", token);
      localStorage.setItem("invita_user_id", user.id);
    }

    set({
      currentUser: user,
      currentRole: user.role,
      token,
      isAuthenticated: true,
      activeCommunityId: user.communityId || mockCommunities[0].id,
    });

    return { success: true };
  },

  mockLoginAsRole: (role: Role) => {
    const user = mockUsers.find((u) => u.role === role) || {
      id: `custom-${role}`,
      name: `Demo ${role.replace("_", " ")}`,
      email: `${role}@invita.demo`,
      role: role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const token = `invita_mock_${role}_${Date.now()}`;
    setAuthCookies(token, role);

    if (typeof window !== "undefined") {
      localStorage.setItem("invita_token", token);
      localStorage.setItem("invita_user_id", user.id);
    }

    set({
      currentUser: user,
      currentRole: role,
      token,
      isAuthenticated: true,
      activeCommunityId: user.communityId || mockCommunities[0].id,
    });
  },

  switchUser: (userId: string) => {
    const user = mockUsers.find((u) => u.id === userId);
    if (user) {
      const token = `invita_jwt_${user.id}_${Date.now()}`;
      setAuthCookies(token, user.role);
      if (typeof window !== "undefined") {
        localStorage.setItem("invita_token", token);
        localStorage.setItem("invita_user_id", user.id);
      }
      set({
        currentUser: user,
        currentRole: user.role,
        token,
        isAuthenticated: true,
        activeCommunityId: user.communityId || mockCommunities[0].id,
      });
    }
  },

  switchRole: (role: Role) => {
    const { currentUser } = get();
    if (!currentUser) return;
    setAuthCookies(get().token || "token", role);
    set({
      currentRole: role,
      currentUser: {
        ...currentUser,
        role: role,
      },
    });
  },

  setActiveCommunityId: (activeCommunityId: string) => {
    set({ activeCommunityId });
  },

  logout: () => {
    clearAuthCookies();
    if (typeof window !== "undefined") {
      localStorage.removeItem("invita_token");
      localStorage.removeItem("invita_user_id");
    }
    set({
      currentUser: null,
      currentRole: null,
      token: null,
      isAuthenticated: false,
    });
  },
}));
