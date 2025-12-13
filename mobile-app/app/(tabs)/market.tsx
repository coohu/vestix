import { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { FlashList } from '@shopify/flash-list';
import useAppStore from '../store';
import SearchComponent from '../../components/SearchComponent';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

// A single item in the market list
const MarketListItem = ({ item }:any) => {
    const { watchlistSymbols, toggleWatchlist } = useAppStore();
    const isWatched = watchlistSymbols.some(w => w.symbol === item.symbol);

    return (
        <Link href={{ pathname: "/detail", params: { asset: JSON.stringify(item) } }} asChild>
            <TouchableOpacity style={styles.listItem}>
                <TouchableOpacity onPress={() => toggleWatchlist(item)} style={styles.watchButton}>
                    <Ionicons name={isWatched ? "star" : "star-outline"} size={24} color={isWatched ? "gold" : "gray"} />
                </TouchableOpacity>
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
        </Link>
    );
};

// A generic component to display a list for a market category
const MarketCategoryList = ({ category }) => {
  const { markets, loading, fetchMarketData } = useAppStore();
  const data = markets[category];

  useEffect(() => {
    fetchMarketData(category);
  }, [category, fetchMarketData]);

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
  const loadWatchlist = useAppStore(state => state.loadWatchlist);
  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Markets</Text>
      <SearchComponent />
      <Tab.Navigator>
        <Tab.Screen name="Watchlist" children={() => <MarketCategoryList category="watchlist" />} />
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
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  watchButton: {
    marginRight: 16,
  },
  itemLeft: {
    flex: 1,
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
