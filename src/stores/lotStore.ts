import { create } from 'zustand';
import { Lot, CreateLotInput, LotFilters, PaginatedResponse } from '@/types';

interface LotState {
  lots: Lot[];
  currentLot: Lot | null;
  activeLots: Lot[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;

  // Actions
  fetchLots: (filters?: LotFilters) => Promise<void>;
  fetchActiveLots: () => Promise<void>;
  fetchLot: (id: string) => Promise<void>;
  createLot: (lotData: CreateLotInput) => Promise<Lot>;
  updateLot: (id: string, lotData: Partial<Lot>) => Promise<Lot>;
  deleteLot: (id: string) => Promise<void>;
  clearError: () => void;
  setCurrentLot: (lot: Lot | null) => void;
}

export const useLotStore = create<LotState>((set, get) => ({
  lots: [],
  currentLot: null,
  activeLots: [],
  isLoading: false,
  error: null,
  pagination: null,

  fetchLots: async (filters?: LotFilters) => {
    set({ isLoading: true, error: null });

    try {
      const queryParams = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`/api/lots?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch lots');
      }

      const result = data.data as PaginatedResponse<Lot>;

      set({
        lots: result.data,
        pagination: result.pagination,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch lots',
      });
    }
  },

  fetchActiveLots: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/lots/active');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch active lots');
      }

      set({
        activeLots: data.data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch active lots',
      });
    }
  },

  fetchLot: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/lots/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch lot');
      }

      set({
        currentLot: data.data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch lot',
      });
    }
  },

  createLot: async (lotData: CreateLotInput) => {
    set({ isLoading: true, error: null });

    try {
      // Получаем токен из authStore
      const authStore = (window as any).__authStore;
      const tokens = authStore?.getState()?.tokens;

      if (!tokens) {
        throw new Error('No access token');
      }

      const response = await fetch('/api/lots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(lotData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create lot');
      }

      const newLot = data.data as Lot;

      set(state => ({
        lots: [newLot, ...state.lots],
        isLoading: false,
        error: null,
      }));

      return newLot;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create lot',
      });
      throw error;
    }
  },

  updateLot: async (id: string, lotData: Partial<Lot>) => {
    set({ isLoading: true, error: null });

    try {
      // Получаем токен из authStore
      const authStore = (window as any).__authStore;
      const tokens = authStore?.getState()?.tokens;

      if (!tokens) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/lots/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(lotData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update lot');
      }

      const updatedLot = data.data as Lot;

      set(state => ({
        lots: state.lots.map(l => (l._id === id ? updatedLot : l)),
        activeLots: state.activeLots.map(l => (l._id === id ? updatedLot : l)),
        currentLot: state.currentLot?._id === id ? updatedLot : state.currentLot,
        isLoading: false,
        error: null,
      }));

      return updatedLot;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update lot',
      });
      throw error;
    }
  },

  deleteLot: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      // Получаем токен из authStore
      const authStore = (window as any).__authStore;
      const tokens = authStore?.getState()?.tokens;

      if (!tokens) {
        throw new Error('No access token');
      }

      const response = await fetch(`/api/lots/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete lot');
      }

      set(state => ({
        lots: state.lots.filter(l => l._id !== id),
        activeLots: state.activeLots.filter(l => l._id !== id),
        currentLot: state.currentLot?._id === id ? null : state.currentLot,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete lot',
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setCurrentLot: (lot: Lot | null) => {
    set({ currentLot: lot });
  },
}));
