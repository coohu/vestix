import { useEffect } from "react";
import useAppStore from "@/hooks/use-app-store";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const { markets, loading, fetchMarketData } = useAppStore();
  useEffect(() => { fetchMarketData('status')  }, [fetchMarketData]);
  
  return (
  <View style={styles.container}>
    {loading.status ? <ActivityIndicator size="large" /> : <>
      {markets.status.map((status, index) =>
        <View style={styles.main} key={index}>
          <Text style={styles.title}>{status.region}</Text>
          <Text style={styles.title}>{status.current_status}</Text>
          <Text style={styles.title}>{status.primary_exchanges}</Text>
          <Text style={styles.title}>{status.local_open}</Text>
          <Text style={styles.title}>{status.local_close}</Text>
          <Text style={styles.subtitle}>{status.notes}</Text>
        </View>
      )}
    </>}
  </View>);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  },
  main: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 960,
    marginHorizontal: "auto",
  },
  title: {
    fontSize: 64,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 36,
    color: "#38434D",
  },
});
