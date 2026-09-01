import { Text, View } from "react-native";
import type { Market } from "@/types/database";

export function MarketMap({
  markets,
  height = 220,
}: {
  markets: Array<Pick<Market, "id" | "name" | "slug" | "lat" | "lng">>;
  height?: number;
}) {
  if (!markets.length) return null;
  return (
    <View style={{ height }} className="items-center justify-center bg-secondary">
      <Text className="text-sm text-muted-foreground">Map is on iOS and Android.</Text>
    </View>
  );
}
