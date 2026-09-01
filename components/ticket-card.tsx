import { Linking, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { Button } from "@/components/ui/button";
import {
  DAY_PLAN_NAME,
  DAY_PLAN_TODAY,
} from "@/lib/constants";
import {
  formatAboutTime,
  formatSlipDate,
  isAppleMapsDevice,
  mapsUrl,
  ticketIsToday,
  TRAVEL_MODES,
} from "@/lib/day-plan";
import { distanceMeters } from "@/lib/geo";
import { useDayPlan } from "@/providers/day-plan";
import { useDirectory } from "@/providers/directory";
import { useGeo } from "@/providers/geo";
import { cn } from "@/lib/utils";

export function TicketCard() {
  const { plan, setMode, toggleVendor, setPlan } = useDayPlan();
  const { vendors } = useDirectory();
  const { coords } = useGeo();
  if (!plan) {
    return (
      <View className="border border-border bg-card p-4">
        <Text className="font-heading text-xl text-foreground">{DAY_PLAN_TODAY}</Text>
        <Text className="mt-2 text-base text-muted-foreground">
          Add a hall from Find Markets to start today’s {DAY_PLAN_NAME}.
        </Text>
      </View>
    );
  }
  const stalls = vendors.filter((vendor) => plan.vendorSlugs.includes(vendor.slug));
  const meters = coords
    ? distanceMeters(coords, { lat: plan.hall.lat, lng: plan.hall.lng })
    : null;
  const heading = ticketIsToday(plan.hall.date) ? DAY_PLAN_TODAY : `Ticket · ${formatSlipDate(plan.hall.date)}`;

  return (
    <View className="border border-stamp bg-card p-4">
      <Text className="text-sm text-stamp">{heading}</Text>
      <Link href={`/markets/${plan.hall.slug}`} asChild>
        <Pressable>
          <Text className="mt-1 font-heading text-2xl text-foreground">{plan.hall.name}</Text>
        </Pressable>
      </Link>
      <Text className="mt-1 text-sm text-muted-foreground">
        {plan.hall.hours ? `${plan.hall.hours} · ` : ""}
        {plan.hall.address}
      </Text>
      {meters != null ? (
        <Text className="mt-1 text-sm text-muted-foreground">
          {formatAboutTime(meters, plan.mode)}
        </Text>
      ) : null}
      <View className="mt-3 flex-row gap-2">
        {TRAVEL_MODES.map((mode) => (
          <Pressable
            key={mode.id}
            onPress={() => setMode(mode.id)}
            className={cn(
              "border px-2 py-1",
              plan.mode === mode.id ? "border-stamp bg-stamp/10" : "border-border",
            )}
          >
            <Text className="text-sm">{mode.label}</Text>
          </Pressable>
        ))}
      </View>
      {stalls.map((vendor) => (
        <View key={vendor.slug} className="mt-3 flex-row items-center justify-between border-t border-border pt-3">
          <Link href={`/vendors/${vendor.slug}`} asChild>
            <Pressable className="flex-1 pr-3">
              <Text className="font-heading text-base">{vendor.name}</Text>
            </Pressable>
          </Link>
          <Button title="Remove" variant="ghost" onPress={() => toggleVendor(vendor.slug)} />
        </View>
      ))}
      <View className="mt-4 flex-row gap-2">
        <Button
          title="Directions"
          onPress={() =>
            void Linking.openURL(mapsUrl(plan.hall.lat, plan.hall.lng, plan.mode, isAppleMapsDevice()))
          }
        />
        <Button title="Clear" variant="outline" onPress={() => setPlan(null)} />
      </View>
    </View>
  );
}
