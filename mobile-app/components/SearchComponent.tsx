import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MarketCategory } from '@/hooks/use-app-store';
import Constants from 'expo-constants';
import { Link } from 'expo-router';
import { useState } from 'react';
import { create } from 'zustand';

export interface SearchAsset {
  symbol: string;
  name: string;
  category: MarketCategory;
  price?: number;
  [key: string]: any; // Allows for extra properties from the search API
}

interface SearchState {
  results: SearchAsset[];
  loading: boolean;
  error: string | null;
}

interface SearchActions {
  searchAssets: (query: string) => Promise<void>;
}

type SearchStore = SearchState & SearchActions;

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3000';

const useSearchStore = create<SearchStore>()((set, get) => ({
  results: [],
  loading: false,
  error: null,

  searchAssets: async (query: string) => {
    // Trim query and check for empty string
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      set({ results: [], loading: false, error: null });
      return;
    }
   
    set({ loading: true, error: null });
    
    try {
      const res = await fetch(`${API_BASE_URL}/search?query=${trimmedQuery}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch search results');
      }
      
      const data: SearchAsset[] = await res.json();
      set({ results: data, loading: false });
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown search error occurred';
      set({ error: errorMessage, loading: false });
    }
  },
}));

export default function SearchComponent() {
  const [query, setQuery] = useState('');
  const { results, loading, searchAssets } = useSearchStore();

  const handleSearch = (text: string) => {
    setQuery(text);
    searchAssets(text);
  };

  const renderItem = ({ item }: { item: SearchAsset }) => (
    <Link asChild
      href={{ pathname: "/detail", params: { asset: JSON.stringify(item) } }} 
    >
      <TouchableOpacity style={styles.resultItem}>
        <Text>{item.name} ({item.symbol})</Text>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search assets..."
        value={query}
        onChangeText={handleSearch} // TypeScript knows 'text' is a string
      />
      {loading && <ActivityIndicator />}
      {results.length > 0 && query.length > 0 && ( // Only show if there's a non-empty query
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.symbol}
          style={styles.resultsList}
          keyboardShouldPersistTaps="handled" // Improves interaction with search results
        />
      )}
      {useSearchStore().error && (
        <Text style={styles.errorText}>Error: {useSearchStore().error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    zIndex: 10, // Ensure search results list appears above content
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff', // Ensure visibility over other elements
  },
  resultsList: {
    marginTop: 8,
    maxHeight: 200,
    backgroundColor: '#fff',
    borderColor: '#eee',
    borderWidth: 1,
    borderRadius: 8,
    position: 'absolute', // Make it float over the content below the input
    top: 56, // Adjust this based on input height + container padding
    left: 16,
    right: 16,
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  }
});