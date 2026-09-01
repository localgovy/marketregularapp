import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { TicketCard } from "@/components/ticket-card";
import { MarketRow, VendorRow } from "@/components/rows";
import { DAY_PLAN_NAME } from "@/lib/constants";
import { useAuth } from "@/providers/auth";
import { useDirectory } from "@/providers/directory";

export default function SavedScreen() {
  const { user, saves } = useAuth();
  const { markets, vendors } = useDirectory();
  const savedMarkets = markets.filter((market) => saves.markets.includes(market.slug));
  const savedVendors = vendors.filter((vendor) => saves.vendors.includes(vendor.slug));

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 py-5 pb-10">
      <Text className="font-heading text-3xl text-foreground">Saved</Text>
      {user ? (
        <Text className="mt-2 mb-6 text-lg leading-snug text-muted-foreground">
          Markets, stalls, and today’s {DAY_PLAN_NAME} on this account.
        </Text>
      ) : (
        <Text className="mt-2 mb-6 text-lg leading-snug text-muted-foreground">
          <Link href="/login?next=/saved" asChild>
            <Text className="font-medium text-foreground">Sign in</Text>
          </Link>{" "}
          to save markets and stalls to this account.
        </Text>
      )}
      <TicketCard />
      {user ? (
        <View className="mt-8">
          <Text className="font-heading text-xl">Halls</Text>
          {savedMarkets.length ? (
            savedMarkets.map((market) => <MarketRow key={market.id} market={market} />)
          ) : (
            <Text className="mt-2 text-muted-foreground">No halls saved yet.</Text>
          )}
          <Text className="mt-8 font-heading text-xl">Stalls</Text>
          {savedVendors.length ? (
            savedVendors.map((vendor) => <VendorRow key={vendor.id} vendor={vendor} />)
          ) : (
            <Text className="mt-2 text-muted-foreground">No stalls saved yet.</Text>
          )}
        </View>
      ) : (
        <Link href="/login?next=/saved" asChild>
          <Pressable className="mt-6">
            <Text className="text-primary">Sign in</Text>
          </Pressable>
        </Link>
      )}
    </ScrollView>
  );
}
