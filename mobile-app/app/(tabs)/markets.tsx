import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import useAppStore, { MarketCategory } from '../../hooks/use-app-store';
import SearchComponent from '../../components/SearchComponent';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useEffect } from 'react';
import SecuritiesList from '@/components/securities';

const MarketListItem = ({ item }:any) => {
  const { watchlistSymbols, toggleWatchlist } = useAppStore();
  const isWatched = watchlistSymbols.some(w => w.symbol === item.symbol);

  return (
  <Link href={{ pathname: "/detail", params: { asset: JSON.stringify(item) } }} asChild>
    <TouchableOpacity style={styles.listItem}>
      <View style={{display:'flex', flexDirection:'row', justifyContent:'space-between', width:'100%'}}>
        <View style={{flexDirection:'row', alignItems:'center',justifyContent:'flex-start'}}>
          <TouchableOpacity onPress={() => toggleWatchlist(item)} style={styles.watchButton}>
            <Ionicons name={isWatched ? "star" : "star-outline"} size={24} color={isWatched ? "gold" : "gray"} />
          </TouchableOpacity>
          <Text style={styles.itemSymbol}>{item.name}</Text>
        </View>
        <Text style={styles.itemPrice}>${item.open?.toFixed(2)}</Text>
        <Text style={styles.itemPrice}>${item.high?.toFixed(2)}</Text>
        <Text style={styles.itemPrice}>${item.low?.toFixed(2)}</Text>
        <Text style={styles.itemPrice}>${item.close?.toFixed(2)}</Text>
        <Text style={styles.itemPrice}>{item.volume}</Text>
      </View>
    </TouchableOpacity>
  </Link>);
};

// A generic component to display a list for a market category
const MarketCategoryList = ({ category }:{category: MarketCategory}) => {
  const { markets, loading, fetchMarketData } = useAppStore();
  const data = markets[category];

  useEffect(() => { fetchMarketData(category)  }, [category, fetchMarketData]);

  if (loading[category] && data.length === 0) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
  <View style={{ flex: 1, flexDirection:'column' }}>
    <View style={{ flexDirection:'row', display:'flex',justifyContent:'space-evenly',paddingLeft:10}}>
      <Text style={styles.header}>名称</Text>
      <Text style={styles.header}>开</Text>
      <Text style={styles.header}>高</Text>
      <Text style={styles.header}>低</Text>
      <Text style={styles.header}>关</Text>
      <Text style={styles.header}>量</Text>
    </View>
    <FlashList data={data}
      renderItem={({ item }) => <MarketListItem item={item} />}
      keyExtractor={item => item.symbol}
      onRefresh={() => fetchMarketData(category)}
      refreshing={loading[category]}
    />
  </View>);
};


const Tab = createMaterialTopTabNavigator();

export default function MarketScreen() {
  const loadWatchlist = useAppStore(state => state.loadWatchlist);
  useEffect(() => { loadWatchlist() }, [loadWatchlist]);

  return (
  <SafeAreaView style={styles.container}>
    <SearchComponent />
    <Tab.Navigator>
      <Tab.Screen name="关注" children={() => <MarketCategoryList category="watchlist" />} />
      <Tab.Screen name="数字币" children={() => <MarketCategoryList category="crypto" />} />
      <Tab.Screen name="证券" children={() => <SecuritiesList category="index" />} />
      <Tab.Screen name="期货" children={() => <MarketCategoryList category="future" />} />
      <Tab.Screen name="外汇" children={() => <MarketCategoryList category="fx" />} />
    </Tab.Navigator>
  </SafeAreaView>);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 14,
    padding: 8,
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
    marginRight: 10,
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'column',
  },
  itemSymbol: {
    fontSize: 12,
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
    fontSize: 14,
    textAlign: 'right',
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
