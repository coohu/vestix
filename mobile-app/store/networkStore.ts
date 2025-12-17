import { create } from 'zustand';

interface NetworkState {
  isConnected: boolean;
  setIsConnected: (isConnected: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true,
  setIsConnected: (isConnected: boolean) => set({ isConnected }),
}));
