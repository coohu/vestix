import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

const useAppStore = create((set, get) => ({
  markets: {
    crypto: [],
    index: [],
    metal: [],
    fx: [],
    watchlist: [],
  },
  loading: {
    crypto: false,
    index: false,
    metal: false,
    fx: false,
    watchlist: false,
  },
  watchlistSymbols: [],
  error: null,

  loadWatchlist: async () => {
    try {
      const symbols = await AsyncStorage.getItem('watchlist');
      if (symbols) {
        set({ watchlistSymbols: JSON.parse(symbols) });
      }
    } catch (e) {
      console.error('Failed to load watchlist', e);
    }
  },

  toggleWatchlist: async (asset) => {
    const { watchlistSymbols } = get();
    const isWatched = watchlistSymbols.some(item => item.symbol === asset.symbol);
    let newSymbols;
    if (isWatched) {
        newSymbols = watchlistSymbols.filter(item => item.symbol !== asset.symbol);
    } else {
        newSymbols = [...watchlistSymbols, { symbol: asset.symbol, category: asset.category }];
    }
    set({ watchlistSymbols: newSymbols });
    await AsyncStorage.setItem('watchlist', JSON.stringify(newSymbols));
  },

  fetchMarketData: async (category) => {
    if (get().loading[category]) return;

    set(state => ({ loading: { ...state.loading, [category]: true } }));
    try {
      if (category === 'watchlist') {
        const { watchlistSymbols } = get();
        // This is a simplified implementation. A real app would fetch
        // each asset individually or have a dedicated watchlist endpoint.
        // For now, we'll just filter the existing market data.
        const allMarkets = Object.values(get().markets).flat();
        const watchlistData = allMarkets.filter(asset => watchlistSymbols.some(item => item.symbol === asset.symbol));
        set(state => ({
            markets: { ...state.markets, watchlist: watchlistData },
            loading: { ...state.loading, watchlist: false },
        }));
        return;
      }

      const response = await fetch(`${API_BASE_URL}/markets?category=${category}`);
      if (!response.ok) throw new Error(`Failed to fetch ${category} data`);
      const data = await response.json();

      set(state => ({
        markets: { ...state.markets, [category]: data },
        loading: { ...state.loading, [category]: false },
      }));
    } catch (error) {
      set({ error: error.message, loading: { ...get().loading, [category]: false } });
    }
  },
}));

export default useAppStore;
