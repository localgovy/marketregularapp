import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { FeedCard } from "@/components/feed-card";
import { MarketRow, Panel } from "@/components/rows";
import { LAUNCH_CITY } from "@/lib/launch";
import { upcomingByDay } from "@/lib/upcoming";
import { topVendorsThisWeek, vendorsSellingToday } from "@/lib/vendor-week";
import { useDirectory } from "@/providers/directory";

export default function HomeScreen() {
  const { loading, error, markets, vendors, stalls, scheduleMap, census, tape } = useDirectory();
  const now = new Date();
  const week = upcomingByDay(markets, scheduleMap, now);
  const sellingToday = vendorsSellingToday(stalls, markets, vendors, scheduleMap, now);
  const weekVendors = topVendorsThisWeek(stalls, markets, vendors, scheduleMap, tape, now);
  const openIds = new Set((week.find((group) => group.open)?.slots ?? []).map((slot) => slot.market.id));
  const directory = [
    ...markets.filter((market) => openIds.has(market.id)),
    ...markets.filter((market) => !openIds.has(market.id)),
  ].slice(0, 10);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Loading {LAUNCH_CITY} markets…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-stamp">{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 py-5 pb-10">
      <Text className="font-heading text-3xl text-foreground">
        What’s open today at {LAUNCH_CITY} farmers’ markets
      </Text>
      <Text className="mt-2 text-lg leading-snug text-muted-foreground">
        {census.markets} halls, {census.vendors.toLocaleString("en-CA")} stalls, this week’s hours.
      </Text>

      <View className="mt-6">
        <Panel kicker={LAUNCH_CITY} title="Find a market" tone="find">
          <Link href="/markets" asChild>
            <Pressable className="bg-primary-foreground px-3 py-2">
              <Text className="font-medium text-primary">Search halls and stalls</Text>
            </Pressable>
          </Link>
        </Panel>
      </View>

      <Panel kicker="This week" title="Open now and coming up" tone="open">
        {week.slice(0, 4).map((group) => (
          <View key={group.id} className="mb-4">
            <Text className="text-sm text-muted-foreground">
              {group.label} · {group.date}
            </Text>
            {group.slots.slice(0, 6).map((slot) => (
              <MarketRow key={`${group.id}-${slot.market.id}`} market={slot.market} />
            ))}
          </View>
        ))}
        <Link href="/events" asChild>
          <Pressable className="mt-2">
            <Text className="text-sm font-medium text-primary">Full week and calendar</Text>
          </Pressable>
        </Link>
      </Panel>

      {sellingToday.length ? (
        <Panel kicker="On the floor" title="Stalls selling today" tone="vendors">
          {sellingToday.slice(0, 5).map((row) => (
            <Link key={row.vendorSlug} href={`/vendors/${row.vendorSlug}`} asChild>
              <Pressable className="border-b border-border py-3">
                <Text className="font-heading text-base">{row.vendorName}</Text>
                <Text className="text-sm text-muted-foreground">
                  {row.marketName}
                  {row.open ? " · open now" : ""}
                </Text>
              </Pressable>
            </Link>
          ))}
        </Panel>
      ) : null}

      {weekVendors.length ? (
        <Panel kicker="This week" title="Stalls worth a walk" tone="vendors">
          {weekVendors.slice(0, 6).map((pick) => (
            <Link key={pick.vendorSlug} href={`/vendors/${pick.vendorSlug}`} asChild>
              <Pressable className="border-b border-border py-3">
                <Text className="font-heading text-base">{pick.vendorName}</Text>
                <Text className="text-sm text-muted-foreground">
                  {pick.where[0]?.marketName}
                  {pick.where[0]?.when ? ` · ${pick.where[0].when}` : ""}
                </Text>
              </Pressable>
            </Link>
          ))}
        </Panel>
      ) : null}

      <Panel kicker="Directory" title={`${LAUNCH_CITY} halls`} tone="directory">
        {directory.map((market) => (
          <MarketRow key={market.id} market={market} />
        ))}
        <Link href="/markets" asChild>
          <Pressable className="mt-3">
            <Text className="text-sm font-medium text-primary">All markets</Text>
          </Pressable>
        </Link>
      </Panel>

      {tape.length ? (
        <Panel kicker="Floor" title="Latest from the halls">
          {tape.slice(0, 4).map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </Panel>
      ) : null}
    </ScrollView>
  );
}
