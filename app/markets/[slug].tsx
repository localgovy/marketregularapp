import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { BackHeader } from "@/components/chrome";
import { FeedCard } from "@/components/feed-card";
import { FloorComposer } from "@/components/floor-composer";
import { MarketMap } from "@/components/market-map";
import { SaveButton } from "@/components/save-button";
import { VendorRow } from "@/components/rows";
import { Button } from "@/components/ui/button";
import { getMarketBySlug } from "@/lib/data/catalog";
import { hallFromMarket } from "@/lib/day-plan";
import { externalHref } from "@/lib/format";
import { toGeoMarket } from "@/lib/geo";
import { marketPlaceLine } from "@/lib/listing-copy";
import { formatSchedule, nextOpenLabel } from "@/lib/schedule";
import { sortTagsForDisplay } from "@/lib/find-paths";
import { tagLabel } from "@/lib/tag-label";
import { useDayPlan } from "@/providers/day-plan";
import { useDirectory } from "@/providers/directory";
import type { MarketDetail } from "@/types/database";

export default function MarketDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { stalls } = useDirectory();
  const { setHall } = useDayPlan();
  const [market, setMarket] = useState<MarketDetail | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    void getMarketBySlug(slug).then(setMarket);
  }, [slug]);

  if (market === undefined) {
    return (
      <View className="flex-1 bg-background">
        <BackHeader title="Market" />
        <Text className="p-4 text-muted-foreground">Loading…</Text>
      </View>
    );
  }
  if (!market) {
    return (
      <View className="flex-1 bg-background">
        <BackHeader title="Market" />
        <Text className="p-4 text-stamp">That hall is not in the directory.</Text>
      </View>
    );
  }

  const now = new Date();
  const when = market.schedules.length ? nextOpenLabel(market.schedules, market.province, now) : null;
  const hall = hallFromMarket(market, market.schedules, undefined, now);
  const hallStalls = stalls.filter((stall) => stall.market_id === market.id);

  return (
    <View className="flex-1 bg-background">
      <BackHeader title={market.name} />
      <ScrollView contentContainerClassName="pb-10">
        <View className="px-4 pt-4">
          <Text className="text-sm text-muted-foreground">{marketPlaceLine(market.address, market.city)}</Text>
          <Text className="mt-1 font-heading text-3xl text-foreground">{market.name}</Text>
          {when ? <Text className="mt-2 text-base font-medium text-primary">{when}</Text> : null}
          <View className="mt-4 flex-row gap-2">
            <SaveButton kind="market" slug={market.slug} />
            <Button title="Add to ticket" variant="outline" onPress={() => setHall(hall)} />
          </View>
          {market.tags.length ? (
            <Text className="mt-3 text-sm text-muted-foreground">
              {sortTagsForDisplay(market.tags).map(tagLabel).join(" · ")}
            </Text>
          ) : null}
          {market.about ? (
            <Text className="mt-4 text-base leading-snug text-foreground">{market.about}</Text>
          ) : null}
          <View className="mt-4">
            {market.schedules.map((row) => {
              const formatted = formatSchedule(row);
              return (
                <Text key={row.id} className="text-sm text-foreground">
                  {formatted.day} {formatted.hours} · {formatted.detail}
                </Text>
              );
            })}
          </View>
          <View className="mt-4 flex-row flex-wrap gap-3">
            {externalHref(market.website) ? (
              <Pressable onPress={() => void Linking.openURL(externalHref(market.website)!)}>
                <Text className="text-sm text-primary">Website</Text>
              </Pressable>
            ) : null}
            {externalHref(market.instagram) ? (
              <Pressable onPress={() => void Linking.openURL(externalHref(market.instagram)!)}>
                <Text className="text-sm text-primary">Instagram</Text>
              </Pressable>
            ) : null}
            {market.phone ? (
              <Pressable onPress={() => void Linking.openURL(`tel:${market.phone}`)}>
                <Text className="text-sm text-primary">{market.phone}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        <View className="mt-4">
          <MarketMap markets={[market]} height={200} />
        </View>
        <View className="px-4 pt-6">
          <Text className="font-heading text-xl">Stalls</Text>
          {market.vendors.map((vendor) => (
            <VendorRow key={vendor.id} vendor={vendor} extra={vendor.stall ?? undefined} />
          ))}
          <View className="mt-6">
            <FloorComposer
              markets={[toGeoMarket(market)]}
              stalls={hallStalls}
              initialMarketId={market.id}
              next={`/markets/${market.slug}`}
              onPosted={() => void getMarketBySlug(market.slug).then(setMarket)}
            />
          </View>
          {market.feed.length ? (
            <View className="mt-4">
              <Text className="mb-3 font-heading text-xl">From the floor</Text>
              {market.feed.map((item) => (
                <FeedCard key={item.id} item={item} />
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
