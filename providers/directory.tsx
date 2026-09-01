import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getDirectoryCensus,
  getFloorTape,
  listMarkets,
  listSchedules,
  listStalls,
  listVendors,
  type DirectoryCensus,
} from "@/lib/data/catalog";
import { isSupabaseConfigured } from "@/lib/constants";
import type { FloorItem, Market, MarketSchedule, StallRef, Vendor } from "@/types/database";

type DirectoryValue = {
  loading: boolean;
  error: string | null;
  markets: Market[];
  vendors: Vendor[];
  stalls: StallRef[];
  schedules: MarketSchedule[];
  scheduleMap: Map<string, MarketSchedule[]>;
  census: DirectoryCensus;
  tape: FloorItem[];
  reload: () => Promise<void>;
};

const emptyCensus: DirectoryCensus = { markets: 0, vendors: 0, menus: 0, talliedAt: null };

const DirectoryContext = createContext<DirectoryValue | null>(null);

export function DirectoryProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stalls, setStalls] = useState<StallRef[]>([]);
  const [schedules, setSchedules] = useState<MarketSchedule[]>([]);
  const [census, setCensus] = useState<DirectoryCensus>(emptyCensus);
  const [tape, setTape] = useState<FloorItem[]>([]);

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [nextMarkets, nextVendors, nextStalls, nextSchedules, nextCensus, nextTape] =
        await Promise.all([
          listMarkets(),
          listVendors(),
          listStalls(),
          listSchedules(),
          getDirectoryCensus(),
          getFloorTape(40),
        ]);
      setMarkets(nextMarkets);
      setVendors(nextVendors);
      setStalls(nextStalls);
      setSchedules(nextSchedules);
      setCensus(nextCensus);
      setTape(nextTape);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load the directory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const scheduleMap = useMemo(() => {
    const map = new Map<string, MarketSchedule[]>();
    for (const row of schedules) {
      const list = map.get(row.market_id) ?? [];
      list.push(row);
      map.set(row.market_id, list);
    }
    return map;
  }, [schedules]);

  const value = useMemo<DirectoryValue>(
    () => ({
      loading,
      error,
      markets,
      vendors,
      stalls,
      schedules,
      scheduleMap,
      census,
      tape,
      reload,
    }),
    [census, error, loading, markets, reload, scheduleMap, schedules, stalls, tape, vendors],
  );

  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>;
}

export function useDirectory() {
  const value = useContext(DirectoryContext);
  if (!value) throw new Error("useDirectory must be used inside DirectoryProvider");
  return value;
}
