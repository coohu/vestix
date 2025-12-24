import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';
import { runOnJS } from 'react-native-reanimated';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3000'

const { width: screenWidth } = Dimensions.get('window');
const CHART_HEIGHT = 300;
const CHART_WIDTH = screenWidth - 32;
export default function DetailScreen() {
  const { asset: assetString } = useLocalSearchParams();
  const asset = JSON.parse(assetString.toString());

  const [klineData, setKlineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [crosshair, setCrosshair] = useState(null);

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);

  useEffect(() => {
    const fetchKlineData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/kline?symbol=${asset.symbol}&interval=1d&category=${asset.category}`);
        if (!res.ok) throw new Error('Failed to fetch kline data');
        const data = await res.json();
        setKlineData(data);
      } catch (e:any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchKlineData();
  }, [asset]);

  const candles = useMemo(() => {
    if (klineData.length === 0) return [];

    const visibleCandles = Math.floor(klineData.length / scale.value);
    const offset = Math.max(0, Math.min(Math.floor(-translateX.value / (CHART_WIDTH / visibleCandles)), klineData.length - visibleCandles));
    const visibleData = klineData.slice(offset, offset + visibleCandles);

    const max = Math.max(...visibleData.map(d => d.high));
    const min = Math.min(...visibleData.map(d => d.low));
    const candleWidth = CHART_WIDTH / visibleData.length;

    return visibleData.map((d, i) => {
      const x = i * candleWidth;
      const yOpen = CHART_HEIGHT - ((d.open - min) / (max - min)) * CHART_HEIGHT;
      const yClose = CHART_HEIGHT - ((d.close - min) / (max - min)) * CHART_HEIGHT;
      const yHigh = CHART_HEIGHT - ((d.high - min) / (max - min)) * CHART_HEIGHT;
      const yLow = CHART_HEIGHT - ((d.low - min) / (max - min)) * CHART_HEIGHT;

      const color = d.open > d.close ? 'red' : 'green';

      const wickPath = Skia.Path.Make();
      wickPath.moveTo(x + candleWidth / 2, yHigh);
      wickPath.lineTo(x + candleWidth / 2, yLow);

      const bodyPath = Skia.Path.Make();
      bodyPath.addRect(Skia.XYWHRect(x, Math.min(yOpen, yClose), candleWidth, Math.abs(yOpen - yClose)));

      return { wickPath, bodyPath, color };
    });
  }, [klineData, scale.value, translateX.value]);

  const panGesture = Gesture.Pan().onChange((event) => {
    translateX.value += event.changeX;
  });

  const pinchGesture = Gesture.Pinch().onChange((event) => {
    scale.value *= event.scaleChange;
    scale.value = Math.max(1, Math.min(scale.value, 5)); // Clamp scale
  });

  const longPressGesture = Gesture.LongPress().onEnd((e) => {
    runOnJS(setCrosshair)({ x: e.x, y: e.y });
  });

  const composedGesture = Gesture.Race(panGesture, pinchGesture, longPressGesture);

  return (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{asset.name} ({asset.symbol})</Text>
      {loading && <ActivityIndicator size="large" style={styles.loader} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && !error && (
        <GestureDetector gesture={composedGesture}>
          <View style={styles.chartContainer}>
            <Canvas style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
              {candles.map((candle, index) => (
                <React.Fragment key={index}>
                  <Path path={candle.wickPath} strokeWidth={1} color={candle.color} />
                  <Path path={candle.bodyPath} color={candle.color} />
                </React.Fragment>
              ))}
              {crosshair && <Path path={Skia.Path.Make().moveTo(0, crosshair.y).lineTo(CHART_WIDTH, crosshair.y)} color="grey" strokeWidth={1} />}
              {crosshair && <Path path={Skia.Path.Make().moveTo(crosshair.x, 0).lineTo(crosshair.x, CHART_HEIGHT)} color="grey" strokeWidth={1} />}
            </Canvas>
          </View>
        </GestureDetector>
      )}
    </SafeAreaView>
  </GestureHandlerRootView>);
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
