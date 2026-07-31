import { create } from 'zustand';

interface UIState {
  isGlobalLoading: boolean;
  setGlobalLoading: (isLoading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isGlobalLoading: false,
  setGlobalLoading: (isLoading) => set({ isGlobalLoading: isLoading }),
}));
