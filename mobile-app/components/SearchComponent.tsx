import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as AlphaVantage from '@/services/AlphaVantage';
import { MarketCategory } from '@/hooks/use-app-store';
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

const useSearchStore = create<SearchStore>()((set) => ({
  results: [],
  loading: false,
  error: null,

  searchAssets: async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      set({ results: [], loading: false, error: null });
      return;
    }
    set({ loading: true, error: null });
    const results = await AlphaVantage.searchAssets(trimmedQuery);
    set({ results, loading: false });
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
      <TextInput placeholder="搜索..."
        style={styles.input}
        value={query}
        onChangeText={handleSearch} // TypeScript knows 'text' is a string
      />
      {loading && <ActivityIndicator />}
      {results.length > 0 && query.length > 0 && ( 
        <FlatList data={results}
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