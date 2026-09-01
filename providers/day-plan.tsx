import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DAY_PLAN_KEY,
  parseDayPlan,
  type DayPlan,
  type DayPlanHall,
  type TravelMode,
} from "@/lib/day-plan";

type DayPlanValue = {
  plan: DayPlan | null;
  setPlan: (plan: DayPlan | null) => void;
  setHall: (hall: DayPlanHall) => void;
  toggleVendor: (slug: string) => void;
  setMode: (mode: TravelMode) => void;
};

const DayPlanContext = createContext<DayPlanValue | null>(null);

export function DayPlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<DayPlan | null>(null);

  useEffect(() => {
    void AsyncStorage.getItem(DAY_PLAN_KEY).then((raw) => {
      if (!raw) return;
      try {
        setPlanState(parseDayPlan(JSON.parse(raw)));
      } catch {
        setPlanState(null);
      }
    });
  }, []);

  const setPlan = useCallback((next: DayPlan | null) => {
    setPlanState(next);
    if (!next) {
      void AsyncStorage.removeItem(DAY_PLAN_KEY);
      return;
    }
    void AsyncStorage.setItem(DAY_PLAN_KEY, JSON.stringify(next));
  }, []);

  const value = useMemo<DayPlanValue>(
    () => ({
      plan,
      setPlan,
      setHall(hall) {
        setPlan({
          hall,
          vendorSlugs: plan?.hall.slug === hall.slug ? plan.vendorSlugs : [],
          mode: plan?.mode ?? "transit",
        });
      },
      toggleVendor(slug) {
        if (!plan) return;
        const has = plan.vendorSlugs.includes(slug);
        setPlan({
          ...plan,
          vendorSlugs: has
            ? plan.vendorSlugs.filter((item) => item !== slug)
            : [...plan.vendorSlugs, slug].slice(0, 80),
        });
      },
      setMode(mode) {
        if (!plan) return;
        setPlan({ ...plan, mode });
      },
    }),
    [plan, setPlan],
  );

  return <DayPlanContext.Provider value={value}>{children}</DayPlanContext.Provider>;
}

export function useDayPlan() {
  const value = useContext(DayPlanContext);
  if (!value) throw new Error("useDayPlan must be used inside DayPlanProvider");
  return value;
}
