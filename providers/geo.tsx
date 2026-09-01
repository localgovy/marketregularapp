import * as Location from "expo-location";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { distanceMeters, isWithinGeofence, type LatLng } from "@/lib/geo";
import { useDirectory } from "@/providers/directory";
import type { Market } from "@/types/database";

type GeoValue = {
  coords: LatLng | null;
  nearby: Market[];
  requestCoords: () => Promise<LatLng | null>;
};

const GeoContext = createContext<GeoValue | null>(null);

export function GeoProvider({ children }: { children: ReactNode }) {
  const { markets } = useDirectory();
  const [coords, setCoords] = useState<LatLng | null>(null);

  const requestCoords = useCallback(async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") return null;
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const next = { lat: position.coords.latitude, lng: position.coords.longitude };
    setCoords(next);
    return next;
  }, []);

  const nearby = useMemo(() => {
    if (!coords) return [];
    return markets
      .filter((market) =>
        isWithinGeofence(coords, { lat: market.lat, lng: market.lng }, market.geofence_radius_m),
      )
      .sort(
        (a, b) =>
          distanceMeters(coords, { lat: a.lat, lng: a.lng }) -
          distanceMeters(coords, { lat: b.lat, lng: b.lng }),
      );
  }, [coords, markets]);

  const value = useMemo(() => ({ coords, nearby, requestCoords }), [coords, nearby, requestCoords]);
  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>;
}

export function useGeo() {
  const value = useContext(GeoContext);
  if (!value) throw new Error("useGeo must be used inside GeoProvider");
  return value;
}
