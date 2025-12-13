import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Dimensions } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';

const API_BASE_URL = 'http://localhost:3000';
const { width: screenWidth } = Dimensions.get('window');
const CHART_HEIGHT = 300;
const CHART_WIDTH = screenWidth - 32; // padding

export default function DetailScreen({ route }) {
  const { asset } = route.params;
  const [klineData, setKlineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchKlineData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/kline?symbol=${asset.symbol}&interval=1d&category=${asset.category}`);
        if (!response.ok) {
          throw new Error('Failed to fetch kline data');
        }
        const data = await response.json();
        setKlineData(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchKlineData();
  }, [asset]);

  const candlePath = React.useMemo(() => {
    if (klineData.length === 0) return null;

    const path = Skia.Path.Make();
    const max = Math.max(...klineData.map(d => d.high));
    const min = Math.min(...klineData.map(d => d.low));
    const candleWidth = CHART_WIDTH / klineData.length;

    klineData.forEach((d, i) => {
      const x = i * candleWidth;
      const yOpen = CHART_HEIGHT - ((d.open - min) / (max - min)) * CHART_HEIGHT;
      const yClose = CHART_HEIGHT - ((d.close - min) / (max - min)) * CHART_HEIGHT;
      const yHigh = CHART_HEIGHT - ((d.high - min) / (max - min)) * CHART_HEIGHT;
      const yLow = CHART_HEIGHT - ((d.low - min) / (max - min)) * CHART_HEIGHT;

      // Draw wick
      path.moveTo(x + candleWidth / 2, yHigh);
      path.lineTo(x + candleWidth / 2, yLow);

      // Draw candle body
      if (d.open > d.close) { // Red candle
        path.addRect(Skia.XYWHRect(x, yOpen, candleWidth, yClose - yOpen));
      } else { // Green candle
        path.addRect(Skia.XYWHRect(x, yClose, candleWidth, yOpen - yClose));
      }
    });

    return path;
  }, [klineData]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{asset.name} ({asset.symbol})</Text>

      {loading && <ActivityIndicator size="large" style={styles.loader} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {candlePath && (
        <View style={styles.chartContainer}>
          <Canvas style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
            <Path path={candlePath} strokeWidth={1} color="black" />
          </Canvas>
        </View>
      )}
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
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
  error: {
    marginTop: 20,
    textAlign: 'center',
    color: 'red',
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
});
