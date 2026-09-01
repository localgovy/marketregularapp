import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useRouter } from "expo-router";
import { LAUNCH_CENTER, LAUNCH_ZOOM } from "@/lib/launch";
import type { Market } from "@/types/database";

export function MarketMap({
  markets,
  height = 220,
}: {
  markets: Array<Pick<Market, "id" | "name" | "slug" | "lat" | "lng">>;
  height?: number;
}) {
  const router = useRouter();
  const solo = markets.length === 1 ? markets[0] : null;
  if (!markets.length) return null;
  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={{ height, width: "100%" }}
      initialRegion={{
        latitude: solo?.lat ?? LAUNCH_CENTER.lat,
        longitude: solo?.lng ?? LAUNCH_CENTER.lng,
        latitudeDelta: solo ? 0.02 : Math.max(0.18, 0.35 / Math.max(1, LAUNCH_ZOOM / 9)),
        longitudeDelta: solo ? 0.02 : 0.28,
      }}
    >
      {markets.map((market) => (
        <Marker
          key={market.id}
          coordinate={{ latitude: market.lat, longitude: market.lng }}
          pinColor="#3a6558"
          title={market.name}
          onCalloutPress={() => router.push(`/markets/${market.slug}`)}
        />
      ))}
    </MapView>
  );
}
