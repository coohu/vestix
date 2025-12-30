import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import MarketList from '@/components/market-list';

const Tab = createMaterialTopTabNavigator();

export default function MarketScreen() {
  return (
  <SafeAreaView style={styles.container}>
    {/* <SearchComponent /> */}
    <Tab.Navigator>
      <Tab.Screen name="关注" children={() => <MarketList category="watchlist" />} />
      <Tab.Screen name="数字币" children={() => <MarketList category="crypto" />} />
      <Tab.Screen name="证券" children={() => <MarketList category="index" />} />
      <Tab.Screen name="商品" children={() => <MarketList category="future" />} />
      <Tab.Screen name="外汇" children={() => <MarketList category="fx" />} />
    </Tab.Navigator>
  </SafeAreaView>);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  }
});
