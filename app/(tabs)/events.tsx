import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MarketRow } from "@/components/rows";
import { LAUNCH_CITY } from "@/lib/launch";
import {
  monthGrid,
  monthLabel,
  parseYearMonth,
  shiftMonth,
  weekdayShort,
} from "@/lib/events-month";
import { upcomingByDay } from "@/lib/upcoming";
import { useDirectory } from "@/providers/directory";
import { cn } from "@/lib/utils";

export default function EventsScreen() {
  const { markets, schedules, scheduleMap } = useDirectory();
  const week = upcomingByDay(markets, scheduleMap);
  const today = parseYearMonth();
  const [cursor, setCursor] = useState(today);
  const [selected, setSelected] = useState<string | null>(null);
  const cells = useMemo(
    () => monthGrid(cursor.year, cursor.month, markets, schedules),
    [cursor.month, cursor.year, markets, schedules],
  );
  const picked = cells.find((cell) => cell.iso === selected) ?? cells.find((cell) => cell.isToday);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 py-5 pb-10">
      <Text className="font-heading text-3xl text-foreground">Events</Text>
      <Text className="mt-2 mb-6 text-lg leading-snug text-muted-foreground">
        Click on a day, find your market, and start planning your trip.
      </Text>

      {week.map((group) => (
        <View key={group.id} className="mb-6">
          <Text className="font-heading text-lg text-foreground">
            {group.label}{" "}
            <Text className="text-base font-normal text-muted-foreground">{group.date}</Text>
          </Text>
          {group.slots.slice(0, 8).map((slot) => (
            <MarketRow key={`${group.id}-${slot.market.id}`} market={slot.market} />
          ))}
        </View>
      ))}

      <View className="mt-2 flex-row items-center justify-between">
        <Pressable onPress={() => setCursor((current) => shiftMonth(current.year, current.month, -1))}>
          <Text className="text-primary">Previous</Text>
        </Pressable>
        <Text className="font-heading text-lg">{monthLabel(cursor.year, cursor.month)}</Text>
        <Pressable onPress={() => setCursor((current) => shiftMonth(current.year, current.month, 1))}>
          <Text className="text-primary">Next</Text>
        </Pressable>
      </View>
      <View className="mt-3 flex-row">
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <Text key={day} className="flex-1 text-center text-xs text-muted-foreground">
            {weekdayShort(day)}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((cell) => (
          <Pressable
            key={cell.iso}
            onPress={() => setSelected(cell.iso)}
            className={cn(
              "h-12 w-[14.28%] items-center justify-center border border-border",
              !cell.inMonth && "opacity-40",
              cell.isToday && "bg-secondary",
              selected === cell.iso && "bg-primary",
            )}
          >
            <Text className={cn("text-sm", selected === cell.iso ? "text-primary-foreground" : "text-foreground")}>
              {cell.day}
            </Text>
            {cell.events.length ? <View className="mt-0.5 h-1 w-1 rounded-full bg-stamp" /> : null}
          </Pressable>
        ))}
      </View>
      {picked?.events.length ? (
        <View className="mt-5">
          <Text className="font-heading text-lg">{LAUNCH_CITY} · {picked.iso}</Text>
          {picked.events.map((event) => (
            <MarketRow
              key={event.marketId}
              market={markets.find((market) => market.id === event.marketId)!}
            />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
