import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { create } from 'zustand';
import Config from 'react-native-config';

const API_BASE_URL = Config.API_BASE_URL;

const useSearchStore = create((set) => ({
  results: [],
  loading: false,
  error: null,
  searchAssets: async (query:any) => {
    if (!query) {
      set({ results: [], loading: false });
      return;
    }
    set({ loading: true });
    try {
      const response = await fetch(`${API_BASE_URL}/search?query=${query}`);
      if (!response.ok) throw new Error('Failed to fetch search results');
      const data = await response.json();
      set({ results: data, loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },
}));

export default function SearchComponent() {
  const [query, setQuery] = useState('');
  const { results, loading, searchAssets } = useSearchStore();

  const handleSearch = (text) => {
    setQuery(text);
    searchAssets(text);
  };

  const renderItem = ({ item }) => (
    <Link href={{ pathname: "/detail", params: { asset: JSON.stringify(item) } }} asChild>
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
        onChangeText={handleSearch}
      />
      {loading && <ActivityIndicator />}
      {results.length > 0 && (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.symbol}
          style={styles.resultsList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  resultsList: {
    marginTop: 8,
    maxHeight: 200,
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
