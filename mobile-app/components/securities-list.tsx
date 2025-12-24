import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import useAppStore, { MarketCategory } from '@/hooks/use-app-store';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useEffect } from 'react';

const MarketListItem = ({ item }:any) => {
  const { watchlistSymbols, toggleWatchlist } = useAppStore();
  const isWatched = watchlistSymbols.some(w => w.symbol === item.symbol);

  return (
    <TouchableOpacity style={styles.listItem}>
      <View style={{display:'flex', flexDirection:'row', justifyContent:'space-between', width:'100%'}}>
        <View style={{flexDirection:'row', alignItems:'center',justifyContent:'flex-start', width:180}}>
          <TouchableOpacity onPress={() => toggleWatchlist(item)} style={styles.watchButton}>
            <Ionicons name={isWatched ? "star" : "star-outline"} size={24} color={isWatched ? "gold" : "gray"} />
          </TouchableOpacity>
          <Link href={{ pathname: "/detail", params: { asset: JSON.stringify(item) } }} asChild>
            <Text style={styles.itemSymbol}>{item.name}</Text>
          </Link>
        </View>
          <Text style={[styles.itemPrice,styles.w100, styles.alignRight]}>
            {(item.open && typeof item.open === 'number')?`${item.open.toFixed(2)}`:''}
          </Text>
          <Text style={[styles.itemPrice,styles.w100, styles.alignRight]}>
            {(item.close && typeof item.close === 'number')?`${item.close.toFixed(2)}`:''}
          </Text>
          <Text style={[styles.itemPrice,styles.w100, styles.alignRight, item.percent>0? styles.red :  styles.green]}>
            {typeof item.percent === 'number'? `${item.percent} %` :''}
          </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function SecuritiesList ({ category }:{category: MarketCategory}){
  const { markets, loading, fetchMarketData } = useAppStore();
  const data = markets[category];
  useEffect(() => { fetchMarketData(category)  }, [category, fetchMarketData]);
  if (loading[category] && data.length === 0) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
  <View style={{ flex: 1, flexDirection:'column' }}>
    <View style={{ flexDirection:'row', display:'flex',justifyContent:'space-between'}}>
      <Text style={[styles.header,styles.w180, styles.alignRight]}>
        {category=='crypto'?'币种':'名称'}
      </Text>
      <Text style={[styles.header,styles.w100, styles.alignRight]}>开盘</Text>
      <Text style={[styles.header,styles.w100, styles.alignRight]}>收盘</Text>
      <Text style={[styles.header,styles.w100, styles.alignLeft]}>涨幅</Text>
    </View>
    <FlashList data={data}
      renderItem={({ item }) => <MarketListItem item={item} />}
      keyExtractor={item => item.symbol}
      onRefresh={() => fetchMarketData(category)}
      refreshing={loading[category]}
    />
  </View>);
};



const styles = StyleSheet.create({
  red:{
    color:'red'
  },
  green:{
    color:'green'
  },
  header: {
    fontSize: 14,
    padding: 8,
  },
  w50:{
    width:50
  },
  w180:{
    width:180
  },
  w100:{
    width:100
  },
  alignLeft:{
    textAlign:'left',
  },
  alignRight:{
    textAlign:'right'
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
  itemSymbol: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemPrice: {
    fontSize: 14,
    textAlign: 'right',
  },
  positive: {
    color: 'green',
  },
  negative: {
    color: 'red',
  },
});
