import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as CoinGecko from '@/services/CoinGecko';
import * as AlphaVantage from '@/services/AlphaVantage';

export type MarketCategory = 'crypto' | 'index' | 'metal' | 'fx' | 'watchlist' | 'status' | 'future' | 'stock';

export interface Asset {
  symbol: string;
  category: MarketCategory;
  name?: string;
  price?: number;
  changePercent?: number;
  [key: string]: any;
}

export interface KlineData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
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
  klineData: KlineData[];
  watchlistSymbols: WatchlistItem[];
  error: string | null;
  loadWatchlist: () => Promise<void>;
  toggleWatchlist: (asset: Asset) => Promise<void>;
  fetchMarketData: (category: MarketCategory) => Promise<void>;
  fetchKlineData: (symbol: string, category: MarketCategory, interval: string) => Promise<void>;
}

const useAppStore = create<AppStore>((set, get) => ({
  markets: {
    crypto: [],
    index: [],
    metal: [],
    fx: [],
    watchlist: [],
    status: [],
    future: [],
    stock: [],
  },
  loading: {
    crypto: false,
    index: false,
    metal: false,
    fx: false,
    watchlist: false,
    status: false,
    future: false,
    stock: false,
  },
  klineData: [],
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
      let data: any[] = [];
      switch (category) {
        case 'crypto':
          data = await CoinGecko.getMarketData();
          break;
        case 'index':
          const kdd :Record<string, any[]> = await AlphaVantage.getGlobalIndices();
          for (const key of Object.keys(kdd)) {
            const it = kdd[key].pop()
            data.push({
              name: key,
              open: it.open,
              high: it.high,
              low: it.low,
              volume: it.volume,
              timestamp: it.time,
            });
          }
          break;
        case 'metal':
          data = await AlphaVantage.getMetalsData();
          break;
        case 'fx':
          data = await AlphaVantage.getFxData();
          break;
        case 'status':
          data = await AlphaVantage.marketStatus();
          break;
        case 'future':
          data = [{
            name: 'Crude Oil (CL)',
            open: 80.50,
            high: 1.25,
            low: 1.57,
            close: 1.57,
            volume: 1234,
            timestamp: Date.now(),
          }];
          break;
        case 'watchlist':
          const { watchlistSymbols, markets } = get();
          const currentWatchlist = Array.isArray(watchlistSymbols) ? watchlistSymbols : [];
          const allMarkets = Object.values(markets).flat();
          data = allMarkets.filter((asset) =>
            currentWatchlist.some((item) => item.symbol === asset.symbol)
          );
          break;
        default:
          break;
      }
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

  fetchKlineData: async (symbol: string, category: MarketCategory, interval: string) => {
    set({ klineData: [] }); // Clear previous data
    try {
      let data: KlineData[] | null = [];
      if (category === 'crypto') {
        const coinList = await CoinGecko.getCoinList();
        if (!coinList) {
          throw new Error('Could not fetch coin list');
        }
        const coinId = coinList.get(symbol.toUpperCase());
        if (coinId) {
          const days = interval.includes('d') ? '365' : interval.includes('h') ? '30' : '1';
          data = await CoinGecko.getKlineData(coinId, days);
        } else {
          throw new Error(`Symbol ${symbol} not found`);
        }
      } else if (category === 'index' || category === 'stock') {
        data = await AlphaVantage.getKlineData(symbol, interval);
      }
      // Add other categories (metal, fx, future) if needed
      if(data) {
        set({ klineData: data });
      }
    } catch (error: any) {
      set({ error: error.message || 'An error occurred' });
    }
  },

}));

export default useAppStore;
