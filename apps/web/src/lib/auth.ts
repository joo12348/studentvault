import { create } from "zustand";
import { User, UserRole } from "@studentvault/shared-types";
import { authApi, userApi } from "./api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const { user, accessToken } = response.data;
    localStorage.setItem("accessToken", accessToken);
    set({ user, isAuthenticated: true });
  },

  register: async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role?: string
  ) => {
    await authApi.register({ email, password, firstName, lastName, role });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem("accessToken");
      set({ user: null, isAuthenticated: false });
    }
  },

  loadUser: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        set({ isLoading: false });
        return;
      }

      const response = await userApi.getMe();
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem("accessToken");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));

// Helper to check roles
export const hasRole = (user: User | null, role: UserRole): boolean => {
  return user?.role === role;
};

export const isStudent = (user: User | null): boolean =>
  hasRole(user, UserRole.STUDENT);

export const isFaculty = (user: User | null): boolean =>
  hasRole(user, UserRole.FACULTY);

export const isAdmin = (user: User | null): boolean =>
  hasRole(user, UserRole.ADMIN);
