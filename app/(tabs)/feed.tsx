import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { FeedCard } from "@/components/feed-card";
import { FloorComposer } from "@/components/floor-composer";
import { Input } from "@/components/ui/input";
import { getFloorTape } from "@/lib/data/catalog";
import { toGeoMarket } from "@/lib/geo";
import { LAUNCH_CITY } from "@/lib/launch";
import { filterFeed, mentionPlaces } from "@/lib/feed-filter";
import { useDirectory } from "@/providers/directory";
import { requirePublicClient } from "@/lib/supabase/client";
import type { FloorItem } from "@/types/database";

export default function FeedScreen() {
  const { markets, stalls, tape, reload } = useDirectory();
  const [items, setItems] = useState<FloorItem[]>(tape);
  const [q, setQ] = useState("");

  useEffect(() => {
    setItems(tape);
  }, [tape]);

  useEffect(() => {
    const supabase = requirePublicClient();
    const channel = supabase
      .channel("floor-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        void getFloorTape(80).then(setItems);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => {
        void getFloorTape(80).then(setItems);
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(
    () => filterFeed(items, { q, market: "", vendor: "", tag: "", sort: "new" }),
    [items, q],
  );
  const mentions = mentionPlaces(items);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 py-5 pb-10">
      <Text className="font-heading text-3xl text-foreground">Feed</Text>
      <Text className="mt-2 mb-6 text-lg leading-snug text-muted-foreground">
        Posts from {LAUNCH_CITY} markets. Filter by hall, stall, or what’s on the table.
      </Text>
      <FloorComposer
        markets={markets.map(toGeoMarket)}
        stalls={stalls}
        onPosted={() => {
          void getFloorTape(80).then(setItems);
          void reload();
        }}
      />
      <Input value={q} onChangeText={setQ} placeholder="Filter posts" className="mb-4" />
      {mentions.markets.length ? (
        <Text className="mb-4 text-sm text-muted-foreground">
          {mentions.markets
            .slice(0, 4)
            .map((item) => item.name)
            .join(" · ")}
        </Text>
      ) : null}
      {filtered.length ? (
        filtered.map((item) => <FeedCard key={item.id} item={item} />)
      ) : (
        <Text className="text-muted-foreground">No posts yet this week.</Text>
      )}
    </ScrollView>
  );
}
