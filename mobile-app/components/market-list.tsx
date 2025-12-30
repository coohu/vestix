import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import useAppStore, { MarketCategory } from '@/hooks/use-app-store';
import React, { useEffect, useMemo } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

interface RowConfig {
  label: string; 
  renderValue: (item: any) => React.ReactNode; // 如何渲染该数据
  style?: object;
}

const formatPrice = (val: any, fixed = 2) => {
  if (typeof val === 'number') return val.toFixed(fixed);
  if (!val) return '--';
  return val;
};

const getTrendColor = (val: number) => {
  if (val > 0) return styles.red; 
  if (val < 0) return styles.green;
  return styles.gray;
};

const MarketListItem = React.memo(({ item, category }: { item: any; category: MarketCategory }) => {
  const { watchlistSymbols, toggleWatchlist } = useAppStore();
  const isWatched = watchlistSymbols.some((w) => w.symbol === item.symbol);
  const renderRightContent = () => {
    switch (category) {
      case 'index': // 证券: 显示 收盘价 + 涨跌幅
      case 'stock':
        const percent = item.percent || item.changePercent || 0;
        return (
          <View style={styles.rightContainer}>
            <Text style={styles.primaryPrice}>
              {formatPrice(item.close || item.price)}
            </Text>
            <View style={[styles.badge, { backgroundColor: percent >= 0 ? '#ffebee' : '#e8f5e9' }]}>
               <Text style={[styles.secondaryText, getTrendColor(percent)]}>
                {percent > 0 ? '+' : ''}{formatPrice(percent)}%
              </Text>
            </View>
          </View>
        );

      case 'crypto': // 加密货币: 显示 价格
        return (
          <View style={styles.rightContainer}>
             <Text style={styles.primaryPrice}>
              {formatPrice(item.price)}
            </Text>
          </View>
        );

      case 'fx': // 外汇: 显示 收盘价 + 时间
        return (
          <View style={styles.rightContainer}>
            <Text style={styles.primaryPrice}>{formatPrice(item.close, 4)}</Text>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        );

      case 'future': // 期货: 显示 价格 + 单位
        return (
          <View style={styles.rightContainer}>
            <Text style={styles.primaryPrice}>{formatPrice(item.value)}</Text>
            <Text style={styles.subText}>{item.unit}</Text>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        );

      default:
        return (
          <View style={styles.rightContainer}>
            <Text style={styles.primaryPrice}>{formatPrice(item.price || item.close)}</Text>
          </View>
        );
    }
  };

  return (
    <Link href={{ pathname: "/detail", params: { asset: JSON.stringify(item) } }} asChild>
      <TouchableOpacity style={styles.listItem}>
        <View style={styles.leftContainer}>
          <TouchableOpacity onPress={() => toggleWatchlist(item)} style={styles.watchButton}>
            <Ionicons name={isWatched ? "star" : "star-outline"} size={22} color={isWatched ? "#FFD700" : "#B0B0B0"} />
          </TouchableOpacity>
          <View style={styles.nameWrapper}>
            <Text style={styles.itemSymbol} numberOfLines={1} ellipsizeMode="tail">
              {item.name || item.symbol}
            </Text>
            {category !== 'crypto' && item.symbol !== item.name && (
               <Text style={styles.itemCode}>{item.symbol}</Text>
            )}
          </View>
        </View>
        {renderRightContent()}
      </TouchableOpacity>
    </Link>
  );
});

export default function MarketList({ category }: { category: MarketCategory }) {
  const { markets, loading, fetchMarketData } = useAppStore();
  const data = markets[category] || [];

  useEffect(() => {
    fetchMarketData(category);
  }, [category, fetchMarketData]);

  const renderHeader = useMemo(() => {
    let rightLabel = "价格";
    if (category === 'index' || category === 'stock') rightLabel = "最新 / 涨跌";
    if (category === 'future') rightLabel = "价格 / 日期";
    if (category === 'fx') rightLabel = "收盘 / 时间";

    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>名称</Text>
        <Text style={styles.headerText}>{rightLabel}</Text>
      </View>
    );
  }, [category]);

  if (loading[category] && data.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader}
      <FlashList
        data={category === 'future' ? data.filter((it: any) => it.value) : data}
        renderItem={({ item }) => <MarketListItem item={item} category={category} />}
        keyExtractor={(item: any) => item.symbol || item.id || Math.random().toString()}
        onRefresh={() => fetchMarketData(category)}
        refreshing={!!loading[category]}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // 关键：两端对齐
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  /* 左侧布局 */
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // 占据剩余空间，防止右侧被挤出
    marginRight: 10,
  },
  watchButton: {
    marginRight: 12,
    padding: 4, // 增加点击区域
  },
  nameWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  itemSymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  itemCode: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  /* 右侧布局 */
  rightContainer: {
    alignItems: 'flex-end', // 内容右对齐
    minWidth: 80, // 保证最小宽度
  },
  primaryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontVariant: ['tabular-nums'], // 确保数字等宽，防止跳动
  },
  badge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  secondaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subText: {
    fontSize: 12,
    color: '#666',
  },
  dateText: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  /* 颜色工具类 */
  red: { color: '#d32f2f' },
  green: { color: '#2e7d32' },
  gray: { color: '#757575' },
});