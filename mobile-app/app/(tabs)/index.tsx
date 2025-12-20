import { useEffect } from "react";
import useAppStore from "@/hooks/use-app-store";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const { markets, loading, fetchMarketData } = useAppStore();
  useEffect(() => { fetchMarketData('status')  }, [fetchMarketData]);
  return (
  <ScrollView>
    {loading.status && <ActivityIndicator size="large" /> }
    {markets.status.length && markets.status?.map((status:any, index:number) =>
      <View style={styles.col} key={index}>
        <View style={styles.main} key={index}>
          <Text style={styles.title}>{status.region}</Text>
          <Text style={status.current_status === "open" ? styles.open : styles.subtitle}>
            {status.current_status}
          </Text>
          <Text style={styles.subtitle}>({status.local_open} - {status.local_close})</Text>
          <Text style={styles.subtitle}>{status.primary_exchanges}</Text>
        </View>
        <Text style={styles.subtitle}>{status.notes}</Text>
      </View>
    )}
  </ScrollView>);
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "baseline",
    padding: 20,
    gap:10,
  },
  col:{
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    marginBottom: 16,
    gap:5,
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap:8,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    color: "#54575aff",
  },
  open: {
    fontSize: 12,
    color: "#32b037ff",
  },
});
