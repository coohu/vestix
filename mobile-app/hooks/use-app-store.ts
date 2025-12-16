import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://100.64.0.1:3000'

export type MarketCategory = 'crypto' | 'index' | 'metal' | 'fx' | 'watchlist' | 'status';

export interface Asset {
  symbol: string;
  category: MarketCategory;
  name?: string;
  price?: number;
  changePercent?: number;
  [key: string]: any;
}

export interface MarketStatus {
  market_type: string;
  region: string;
  primary_exchanges: string;
  local_open: string;
  local_close: string;
  current_status: string;
  notes: string;
}

export interface WatchlistItem {
  symbol: string;
  category: MarketCategory;
}

interface AppStore {
  markets: Record<MarketCategory, Asset[]> ;
  loading: Record<MarketCategory, boolean>;
  watchlistSymbols: WatchlistItem[];
  error: string | null;
  loadWatchlist: () => Promise<void>;
  toggleWatchlist: (asset: Asset) => Promise<void>;
  fetchMarketData: (category: MarketCategory) => Promise<void>;
}

const useAppStore = create<AppStore>((set, get) => ({
  markets: {
    crypto: [],
    index: [],
    metal: [],
    fx: [],
    watchlist: [],
    status: [],
  },
  loading: {
    crypto: false,
    index: false,
    metal: false,
    fx: false,
    watchlist: false,
    status: false,
  },
  watchlistSymbols: [],
  error: null,

  loadWatchlist: async () => {
    try {
      const symbolsString = await AsyncStorage.getItem('watchlist');
      if (symbolsString) {
        set({ watchlistSymbols: JSON.parse(symbolsString) });
      }
    } catch (e) {
      console.error('Failed to load watchlist', e);
    }
  },

  toggleWatchlist: async (asset: Asset) => {
    const { watchlistSymbols } = get();
    const currentList = Array.isArray(watchlistSymbols) ? watchlistSymbols : [];
    const isWatched = currentList.some((item) => item.symbol === asset.symbol);
    let newSymbols: WatchlistItem[];

    if (isWatched) {
      newSymbols = currentList.filter((item) => item.symbol !== asset.symbol);
    } else {
      newSymbols = [...currentList, { symbol: asset.symbol, category: asset.category }];
    }
    set({ watchlistSymbols: newSymbols });
    try {
      await AsyncStorage.setItem('watchlist', JSON.stringify(newSymbols));
    } catch (e) {
      console.error('Failed to save watchlist', e);
    }
  },

  fetchMarketData: async (category: MarketCategory) => {
    if (get().loading[category]) return;
    set((state) => ({ 
      loading: { ...state.loading, [category]: true },
      error: null
    }));
    try {
      if (category === 'watchlist') {
        const { watchlistSymbols, markets } = get();
        const currentWatchlist = Array.isArray(watchlistSymbols) ? watchlistSymbols : [];
        const allMarkets = Object.values(markets).flat();
        const watchlistData = allMarkets.filter((asset) => 
          currentWatchlist.some((item) => item.symbol === asset.symbol)
        );
        set((state) => ({
          markets: { ...state.markets, watchlist: watchlistData },
          loading: { ...state.loading, watchlist: false },
        }));
        return;
      }
      console.log(`Fetching data for category: ${API_BASE_URL}/markets?category=${category}`);
      const res = await fetch(`${API_BASE_URL}/markets?category=${category}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch ${category} data`);
      }
      const data: Asset = await res.json();
      set((state) => ({
        markets: { ...state.markets, [category]: data },
        loading: { ...state.loading, [category]: false },
      }));
    } catch (error: any) {
      set((state) => ({ 
        error: error.message || 'An error occurred', 
        loading: { ...state.loading, [category]: false } 
      }));
    }
  },

}));

export default useAppStore;