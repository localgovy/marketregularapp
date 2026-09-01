import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { formatPostedAt, formatPriceLevel } from "@/lib/format";
import { isPublicPostPhotoUrl } from "@/lib/post-photos";
import { Image } from "expo-image";
import type { FloorItem } from "@/types/database";

export function FeedCard({ item }: { item: FloorItem }) {
  const photos = item.photos.filter(isPublicPostPhotoUrl).slice(0, 3);
  return (
    <View className="mb-4 border border-border bg-card p-4">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="text-sm text-muted-foreground">{item.author_name ?? "Regular"}</Text>
        <Text className="text-xs text-muted-foreground">{formatPostedAt(item.created_at)}</Text>
      </View>
      {item.market_slug ? (
        <Link href={`/markets/${item.market_slug}`} asChild>
          <Pressable>
            <Text className="mt-1 font-heading text-base text-foreground">{item.market_name}</Text>
          </Pressable>
        </Link>
      ) : null}
      {item.vendor_slug ? (
        <Link href={`/vendors/${item.vendor_slug}`} asChild>
          <Pressable>
            <Text className="text-sm text-primary">{item.vendor_name ?? item.vendor_slug}</Text>
          </Pressable>
        </Link>
      ) : null}
      {item.rating ? (
        <Text className="mt-1 text-sm text-stamp">
          {"★".repeat(item.rating)}
          {item.price_level ? `  ${formatPriceLevel(item.price_level)}` : ""}
          {item.verified_on_site ? "  on site" : ""}
        </Text>
      ) : null}
      <Text className="mt-2 text-base leading-snug text-foreground">{item.body}</Text>
      {item.tags.length ? (
        <Text className="mt-2 text-sm text-muted-foreground">
          {item.tags.map((tag) => `#${tag}`).join(" ")}
        </Text>
      ) : null}
      {photos.length ? (
        <View className="mt-3 flex-row gap-2">
          {photos.map((src) => (
            <Image key={src} source={{ uri: src }} className="h-20 w-20 bg-muted" contentFit="cover" />
          ))}
        </View>
      ) : null}
    </View>
  );
}
