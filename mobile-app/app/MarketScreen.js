import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { FlashList } from '@shopify/flash-list';
import { create } from 'zustand';
import { useNavigation } from '@react-navigation/native';

const API_BASE_URL = 'http://localhost:3000';

// Zustand store for market data
const useMarketStore = create((set, get) => ({
  markets: {
    crypto: [],
    index: [],
    metal: [],
    fx: [],
  },
  loading: {
    crypto: false,
    index: false,
    metal: false,
    fx: false,
  },
  error: null,
  fetchMarketData: async (category) => {
    if (get().loading[category]) return;

    set(state => ({ loading: { ...state.loading, [category]: true } }));
    try {
      const response = await fetch(`${API_BASE_URL}/markets?category=${category}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${category} data`);
      }
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

// A single item in the market list
const MarketListItem = ({ item }) => {
    const navigation = useNavigation();

    return (
        <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate('Details', { asset: item })}>
            <View style={styles.itemLeft}>
            <Text style={styles.itemSymbol}>{item.symbol}</Text>
            <Text style={styles.itemName}>{item.name}</Text>
            </View>
            <View style={styles.itemRight}>
            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            <Text style={[styles.itemChange, item.changePercent >= 0 ? styles.positive : styles.negative]}>
                {item.changePercent.toFixed(2)}%
            </Text>
            </View>
        </TouchableOpacity>
    );
};

// A generic component to display a list for a market category
const MarketCategoryList = ({ category }) => {
  const { markets, loading, fetchMarketData } = useMarketStore();
  const data = markets[category];

  useEffect(() => {
    // Fetch data only if the list is empty
    if (data.length === 0) {
      fetchMarketData(category);
    }
  }, [category, data.length, fetchMarketData]);

  if (loading[category] && data.length === 0) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <FlashList
      data={data}
      renderItem={({ item }) => <MarketListItem item={item} />}
      keyExtractor={item => item.symbol}
      estimatedItemSize={60}
      onRefresh={() => fetchMarketData(category)}
      refreshing={loading[category]}
    />
  );
};


const Tab = createMaterialTopTabNavigator();

export default function MarketScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Markets</Text>
      <Tab.Navigator>
        <Tab.Screen name="Crypto" children={() => <MarketCategoryList category="crypto" />} />
        <Tab.Screen name="Indices" children={() => <MarketCategoryList category="index" />} />
        <Tab.Screen name="Metals" children={() => <MarketCategoryList category="metal" />} />
        <Tab.Screen name="Forex" children={() => <MarketCategoryList category="fx" />} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
  },
  loader: {
    marginTop: 20,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemLeft: {
    flexDirection: 'column',
  },
  itemSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemName: {
    fontSize: 12,
    color: 'gray',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 16,
  },
  itemChange: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  positive: {
    color: 'green',
  },
  negative: {
    color: 'red',
  },
});
