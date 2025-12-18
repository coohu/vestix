import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import SearchComponent from '../../components/SearchComponent';
import { SafeAreaView } from 'react-native-safe-area-context';
import SecuritiesList from '@/components/securities';
import WatchList from '@/components/watchlist';
import FutureList from '@/components/future';
import ForexList from '@/components/forex';
import { StyleSheet } from 'react-native';

const Tab = createMaterialTopTabNavigator();

export default function MarketScreen() {
  return (
  <SafeAreaView style={styles.container}>
    <SearchComponent />
    <Tab.Navigator>
      <Tab.Screen name="关注" children={() => <WatchList category="watchlist" />} />
      <Tab.Screen name="数字币" children={() => <SecuritiesList category="crypto" />} />
      <Tab.Screen name="证券" children={() => <SecuritiesList category="index" />} />
      <Tab.Screen name="商品" children={() => <FutureList category="future" />} />
      <Tab.Screen name="外汇" children={() => <ForexList category="fx" />} />
    </Tab.Navigator>
  </SafeAreaView>);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  }
});
