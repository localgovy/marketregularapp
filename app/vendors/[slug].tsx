import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { BackHeader } from "@/components/chrome";
import { FeedCard } from "@/components/feed-card";
import { FloorComposer } from "@/components/floor-composer";
import { SaveButton } from "@/components/save-button";
import { Button } from "@/components/ui/button";
import { getVendorBySlug } from "@/lib/data/catalog";
import { externalHref, formatPrice } from "@/lib/format";
import { hallFromStall } from "@/lib/day-plan";
import { toGeoMarket } from "@/lib/geo";
import { nextOpenLabel } from "@/lib/schedule";
import { sortTagsForDisplay } from "@/lib/find-paths";
import { tagLabel } from "@/lib/tag-label";
import { useDayPlan } from "@/providers/day-plan";
import { useDirectory } from "@/providers/directory";
import type { VendorDetail } from "@/types/database";

export default function VendorDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { stalls } = useDirectory();
  const { setHall, toggleVendor, plan } = useDayPlan();
  const [vendor, setVendor] = useState<VendorDetail | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    void getVendorBySlug(slug).then(setVendor);
  }, [slug]);

  if (vendor === undefined) {
    return (
      <View className="flex-1 bg-background">
        <BackHeader title="Stall" />
        <Text className="p-4 text-muted-foreground">Loading…</Text>
      </View>
    );
  }
  if (!vendor) {
    return (
      <View className="flex-1 bg-background">
        <BackHeader title="Stall" />
        <Text className="p-4 text-stamp">That stall is not in the directory.</Text>
      </View>
    );
  }

  const now = new Date();
  const home = vendor.markets[0];
  const punch = home ? hallFromStall(home, home.schedules, home.days, now) : null;
  const onTicket = plan?.vendorSlugs.includes(vendor.slug) ?? false;

  return (
    <View className="flex-1 bg-background">
      <BackHeader title={vendor.name} />
      <ScrollView contentContainerClassName="px-4 py-5 pb-10">
        <Text className="font-heading text-3xl text-foreground">{vendor.name}</Text>
        {vendor.markets.length ? (
          <View className="mt-2">
            {vendor.markets.map((market) => (
              <Link key={market.id} href={`/markets/${market.slug}`} asChild>
                <Pressable className="py-1">
                  <Text className="text-base text-muted-foreground">
                    At {market.name} · {nextOpenLabel(market.schedules, market.province, now)}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </View>
        ) : null}
        <View className="mt-4 flex-row gap-2">
          <SaveButton kind="vendor" slug={vendor.slug} />
          {punch ? (
            <Button
              title={onTicket ? "On ticket" : "Add to ticket"}
              variant="outline"
              onPress={() => {
                if (!plan || plan.hall.slug !== punch.slug) setHall(punch);
                toggleVendor(vendor.slug);
              }}
            />
          ) : null}
        </View>
        {vendor.tags.length ? (
          <Text className="mt-3 text-sm text-muted-foreground">
            {sortTagsForDisplay(vendor.tags).map(tagLabel).join(" · ")}
          </Text>
        ) : null}
        {vendor.about ? <Text className="mt-4 text-base leading-snug">{vendor.about}</Text> : null}
        <View className="mt-4 flex-row flex-wrap gap-3">
          {externalHref(vendor.website) ? (
            <Pressable onPress={() => void Linking.openURL(externalHref(vendor.website)!)}>
              <Text className="text-sm text-primary">Website</Text>
            </Pressable>
          ) : null}
          {externalHref(vendor.instagram) ? (
            <Pressable onPress={() => void Linking.openURL(externalHref(vendor.instagram)!)}>
              <Text className="text-sm text-primary">Instagram</Text>
            </Pressable>
          ) : null}
        </View>
        {vendor.menus.length ? (
          <View className="mt-8">
            <Text className="font-heading text-xl">On the table</Text>
            {vendor.menus.map((item) => (
              <View key={item.id} className="border-b border-border py-3">
                <Text className="font-heading text-base">{item.name}</Text>
                <Text className="text-sm text-muted-foreground">
                  {[formatPrice(item.price_cents), item.season, item.description].filter(Boolean).join(" · ")}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {home ? (
          <View className="mt-8">
            <FloorComposer
              markets={vendor.markets.map(toGeoMarket)}
              stalls={stalls.filter((stall) => vendor.markets.some((market) => market.id === stall.market_id))}
              initialMarketId={home.id}
              initialVendorId={vendor.id}
              next={`/vendors/${vendor.slug}`}
              onPosted={() => void getVendorBySlug(vendor.slug).then(setVendor)}
            />
          </View>
        ) : null}
        {vendor.feed.length ? (
          <View className="mt-4">
            <Text className="mb-3 font-heading text-xl">From the floor</Text>
            {vendor.feed.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
