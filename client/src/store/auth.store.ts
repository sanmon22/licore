import { create } from "zustand";
import { User, CustomerType } from "../types";
import { api } from "../services/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("licores_token"),
  isLoading: true,

  login: async (email, password) => {
    const { token, user } = await api.login({ email, password });
    localStorage.setItem("licores_token", token);
    set({ token, user, isLoading: false });
  },

  register: async (payload) => {
    const { token, user } = await api.register(payload);
    localStorage.setItem("licores_token", token);
    set({ token, user, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem("licores_token");
    set({ user: null, token: null, isLoading: false });
  },

  loadSession: async () => {
    const token = localStorage.getItem("licores_token");
    if (!token) {
      set({ user: null, token: null, isLoading: false });
      return;
    }

    try {
      const profile = await api.getProfile();
      set({
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          customerId: profile.customer?.id,
          customerType: profile.customer?.customerType as CustomerType,
        },
        token,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem("licores_token");
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
