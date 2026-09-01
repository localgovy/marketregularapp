import { Pressable, Text, View } from "react-native";
import { type ReactNode } from "react";
import { Link } from "expo-router";
import { nextOpenLabel } from "@/lib/schedule";
import { useDirectory } from "@/providers/directory";
import type { Market, Vendor } from "@/types/database";
import { cn } from "@/lib/utils";

export function MarketRow({ market }: { market: Market }) {
  const { scheduleMap } = useDirectory();
  const when = nextOpenLabel(scheduleMap.get(market.id) ?? [], market.province);
  return (
    <Link href={`/markets/${market.slug}`} asChild>
      <Pressable className="border-b border-border py-3">
        <Text className="font-heading text-lg text-foreground">{market.name}</Text>
        <Text className="mt-0.5 text-sm text-muted-foreground">
          {market.city}
          {when ? ` · ${when}` : ""}
        </Text>
      </Pressable>
    </Link>
  );
}

export function VendorRow({
  vendor,
  extra,
}: {
  vendor: Pick<Vendor, "name" | "slug">;
  extra?: string;
}) {
  return (
    <Link href={`/vendors/${vendor.slug}`} asChild>
      <Pressable className="border-b border-border py-3">
        <Text className="font-heading text-base text-foreground">{vendor.name}</Text>
        {extra ? <Text className="mt-0.5 text-sm text-muted-foreground">{extra}</Text> : null}
      </Pressable>
    </Link>
  );
}

export function Panel({
  kicker,
  title,
  tone = "paper",
  children,
}: {
  kicker: string;
  title: string;
  tone?: "paper" | "leaf" | "find" | "open" | "vendors" | "directory";
  children: ReactNode;
}) {
  const leaf = tone === "leaf" || tone === "find";
  const vendors = tone === "vendors";
  return (
    <View
      className={cn(
        "mb-4 border p-4",
        leaf ? "border-transparent bg-panel-find" : "border-border bg-card",
      )}
    >
      <Text
        className={cn(
          "text-sm",
          leaf ? "text-primary-foreground/80" : vendors ? "text-stamp" : "text-muted-foreground",
        )}
      >
        {kicker}
      </Text>
      <Text
        className={cn(
          "mb-3 font-heading text-2xl",
          leaf ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
