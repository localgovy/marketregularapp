import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MarketMap } from "@/components/market-map";
import { MarketRow, VendorRow } from "@/components/rows";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FIND_ORIGINS,
  FIND_PRODUCTS,
  FIND_SETUP,
  placeAreasForMarkets,
  whenOptions,
  weekdayInToronto,
} from "@/lib/find-paths";
import { searchDirectory } from "@/lib/data/catalog";
import { LAUNCH_CITY } from "@/lib/launch";
import { useDirectory } from "@/providers/directory";
import { useGeo } from "@/providers/geo";
import { tagLabel } from "@/lib/tag-label";
import { cn } from "@/lib/utils";
import type { Market } from "@/types/database";
import type { DirectoryVendor } from "@/lib/vendor-halls";

export default function MarketsScreen() {
  const { markets } = useDirectory();
  const { coords, requestCoords } = useGeo();
  const today = weekdayInToronto();
  const [q, setQ] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [weekday, setWeekday] = useState<number | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [setup, setSetup] = useState<string | undefined>(undefined);
  const [area, setArea] = useState<string | undefined>(undefined);
  const [near, setNear] = useState(false);
  const [results, setResults] = useState<{
    markets: Market[];
    vendors: DirectoryVendor[];
  } | null>(null);
  const [pending, setPending] = useState(false);
  const places = useMemo(() => placeAreasForMarkets(markets), [markets]);

  const run = useCallback(async () => {
    setPending(true);
    const found = await searchDirectory({
      q: q.trim() || undefined,
      openNow,
      weekdays: weekday != null ? [weekday] : undefined,
      tags: tags.length ? tags : undefined,
      setup,
      areas: area ? [area] : undefined,
      near: near && coords ? coords : undefined,
      sort: near && coords ? "near" : "name",
    });
    setResults({ markets: found.markets, vendors: found.vendors });
    setPending(false);
  }, [area, coords, near, openNow, q, setup, tags, weekday]);

  useEffect(() => {
    const idle =
      !q.trim() &&
      !openNow &&
      weekday == null &&
      tags.length === 0 &&
      !setup &&
      !area &&
      !near;
    if (idle) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => {
      void run();
    }, 280);
    return () => clearTimeout(timer);
  }, [area, near, openNow, q, run, setup, tags, weekday]);

  const shownMarkets = results?.markets ?? markets;
  const shownVendors = results?.vendors ?? [];

  function toggleTag(tag: string) {
    setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-10">
      <View className="px-4 py-5">
        <Text className="font-heading text-3xl text-foreground">Find {LAUNCH_CITY} farmers’ markets</Text>
        <View className="mt-4 flex-row gap-2">
          <Input
            className="flex-1"
            value={q}
            onChangeText={setQ}
            placeholder="Search market, vendor, cuisine, or neighbourhood"
            onSubmitEditing={() => void run()}
          />
          <Button title={pending ? "…" : "Find"} onPress={() => void run()} />
        </View>
        <ScrollView horizontal className="mt-3" showsHorizontalScrollIndicator={false}>
          {whenOptions(today).map((chip) => {
            const on = chip.openNow ? openNow : weekday === chip.weekday;
            return (
              <Pressable
                key={chip.id}
                onPress={() => {
                  if (chip.openNow) {
                    setOpenNow(!openNow);
                    setWeekday(undefined);
                  } else {
                    setOpenNow(false);
                    setWeekday(weekday === chip.weekday ? undefined : chip.weekday);
                  }
                }}
                className={cn("mr-2 border px-2 py-1", on ? "border-primary bg-secondary" : "border-border")}
              >
                <Text className="text-sm">{chip.label}</Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => {
              void (async () => {
                if (near) {
                  setNear(false);
                  return;
                }
                const next = coords ?? (await requestCoords());
                if (!next) return;
                setNear(true);
              })();
            }}
            className={cn("mr-2 border px-2 py-1", near ? "border-primary bg-secondary" : "border-border")}
          >
            <Text className="text-sm">Near me</Text>
          </Pressable>
        </ScrollView>
        <ScrollView horizontal className="mt-2" showsHorizontalScrollIndicator={false}>
          {FIND_SETUP.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => setSetup(setup === tag ? undefined : tag)}
              className={cn("mr-2 border px-2 py-1", setup === tag ? "border-primary bg-secondary" : "border-border")}
            >
              <Text className="text-sm">{tagLabel(tag)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView horizontal className="mt-2" showsHorizontalScrollIndicator={false}>
          {FIND_PRODUCTS.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => toggleTag(tag)}
              className={cn(
                "mr-2 border px-2 py-1",
                tags.includes(tag) ? "border-primary bg-secondary" : "border-border",
              )}
            >
              <Text className="text-sm">{tagLabel(tag)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView horizontal className="mt-2" showsHorizontalScrollIndicator={false}>
          {FIND_ORIGINS.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => toggleTag(tag)}
              className={cn(
                "mr-2 border px-2 py-1",
                tags.includes(tag) ? "border-primary bg-secondary" : "border-border",
              )}
            >
              <Text className="text-sm">{tagLabel(tag)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView horizontal className="mt-2" showsHorizontalScrollIndicator={false}>
          {[...places.neighbourhoods, ...places.cities.slice(0, 8)].map((place) => (
            <Pressable
              key={place.q}
              onPress={() => setArea(area === place.q ? undefined : place.q)}
              className={cn(
                "mr-2 border px-2 py-1",
                area === place.q ? "border-primary bg-secondary" : "border-border",
              )}
            >
              <Text className="text-sm">{place.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <MarketMap markets={shownMarkets.slice(0, 80)} height={240} />
      <View className="px-4 pt-4">
        <Text className="font-heading text-xl">Halls</Text>
        {shownMarkets.slice(0, 40).map((market) => (
          <MarketRow key={market.id} market={market} />
        ))}
        {shownVendors.length ? (
          <View className="mt-8">
            <Text className="font-heading text-xl">Stalls</Text>
            {shownVendors.slice(0, 40).map((vendor) => (
              <VendorRow
                key={vendor.id}
                vendor={vendor}
                extra={vendor.halls.map((hall) => hall.name).slice(0, 2).join(" · ")}
              />
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
