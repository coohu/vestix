import { create } from 'zustand';
import * as Prebid from '@/services/Prebid';
import * as Tushare from '@/services/Tushare';
import * as AlphaVantage from '@/services/AlphaVantage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressBarAndroidBase } from 'react-native';

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
          const tkPairs = [
            { from: 'BTC', to: 'USD', name: 'BTC/USD' },
            { from: 'ETH', to: 'USD', name: 'ETH/USD' },
          ];
          for(const {from, to, name} of tkPairs){
            const currs = await AlphaVantage.getCryptoCurrencies(from, to);
            const transformed = AlphaVantage.transformedCryptoCurrencies(currs);
            if(transformed){
              data.push({...transformed, name, symbol:`${from}/${to}`})
            }
            await new Promise(resolve => setTimeout(resolve, 15000));
          }
          break;

        case 'index':
          const symbols = [
            { symbol: 'SPY', name: 'S&P 500' },
            { symbol: 'QQQ', name: 'NASDAQ 100' },
            { symbol: 'XIU.TRT', name: 'TSX 60' },
            { symbol: '000300.SS', name: 'CSI 300' },
          ];
          for (const {symbol, name} of symbols) {
            const scd = await AlphaVantage.getKlineData(symbol);
            const its = AlphaVantage.transformSecurities(scd);
            if( its ){
              data.push({...its, name, symbol})
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          break;
          
        case 'fx':
          data = await Prebid.currencyRates();
          break;
           
        case 'status':
          data = await AlphaVantage.marketStatus()
          break;
          
        case 'future':
          const tgs =['WTI', 'BRENT', 'NATURAL_GAS', 'COPPER','ALUMINUM','ALL_COMMODITIES']
          for( const tg of tgs){
            const cdt = await AlphaVantage.getCommodities({function:tg, interval:'daily'});
            if (cdt && cdt.hasOwnProperty('name') && cdt.hasOwnProperty('data')){
              const it = cdt.data[0]
              data.push({name:cdt.name, symbol:tg, unit:cdt.unit, ...it})
            }
          }
          break;

        case 'watchlist':
          const { watchlistSymbols, markets } = get();
          const currentWatchlist = Array.isArray(watchlistSymbols) ? watchlistSymbols : [];
          const allMarkets = Object.values(markets).flat();
          data = allMarkets.filter((asset) =>
            currentWatchlist.some((item) => item.symbol === asset.symbol)
          );
          // console.log('--------------------watchlist---------------------')
          // data = await Tushare.getHS300()
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
      if (category === 'index' || category === 'stock') {
        data = await AlphaVantage.getKlineData(symbol, interval);
      }
      if(data) {
        set({ klineData: data });
      }
    } catch (error: any) {
      set({ error: error.message || 'An error occurred' });
    }
  },

}));

export default useAppStore;
