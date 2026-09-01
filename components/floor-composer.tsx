import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FLOOR_TAGS } from "@/lib/constants";
import { NOTE_PROMPTS } from "@/lib/floor-note";
import { composeFloorNote, uploadPostPhoto } from "@/lib/presence";
import type { GeoMarket } from "@/lib/geo";
import type { StallRef } from "@/types/database";
import { useAuth } from "@/providers/auth";
import { useGeo } from "@/providers/geo";
import { cn } from "@/lib/utils";

export function FloorComposer({
  stalls,
  markets,
  initialMarketId,
  initialVendorId,
  next = "/feed",
  onPosted,
}: {
  stalls: Array<Pick<StallRef, "id" | "name" | "slug" | "market_id" | "stall">>;
  markets: GeoMarket[];
  initialMarketId?: string;
  initialVendorId?: string;
  next?: string;
  onPosted: () => void;
}) {
  const { user } = useAuth();
  const { coords, nearby } = useGeo();
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(0);
  const [price, setPrice] = useState(0);
  const [marketId, setMarketId] = useState(initialMarketId ?? nearby[0]?.id ?? markets[0]?.id ?? "");
  const [vendorId, setVendorId] = useState(initialVendorId ?? "");
  const [marketQuery, setMarketQuery] = useState("");
  const [vendorQuery, setVendorQuery] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const market = markets.find((item) => item.id === marketId) ?? null;
  const stallOptions = useMemo(
    () => (market ? stalls.filter((stall) => stall.market_id === market.id) : []),
    [market, stalls],
  );
  const tagged = stallOptions.find((stall) => stall.id === vendorId);

  async function submit() {
    if (!user) return;
    if (!market) {
      setMessage("Pick a market.");
      return;
    }
    setPending(true);
    setMessage(null);
    const result = await composeFloorNote({
      marketId: market.id,
      body,
      lat: coords?.lat,
      lng: coords?.lng,
      rating,
      vendorId: tagged?.id,
      vendorSlug: tagged?.slug,
      tags,
      priceLevel: price,
      photos,
    });
    setPending(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setBody("");
    setRating(0);
    setPrice(0);
    setTags([]);
    setPhotos([]);
    onPosted();
  }

  async function addPhoto() {
    if (!user) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (picked.canceled || !picked.assets[0]) return;
    const uploaded = await uploadPostPhoto(picked.assets[0].uri, user.id);
    if (uploaded.error || !uploaded.url) {
      setMessage(uploaded.error ?? "Those photos could not be attached.");
      return;
    }
    setPhotos((current) => [...current, uploaded.url!].slice(0, 8));
  }

  if (!markets.length) return null;

  return (
    <View className="mb-6 border border-border bg-card p-4">
      <Text className="font-heading text-lg text-foreground">
        {NOTE_PROMPTS[0] ?? "What should the next shopper know?"}
      </Text>
      {!user ? (
        <Link href={`/login?next=${encodeURIComponent(next)}`} asChild>
          <Pressable className="mt-3">
            <Text className="text-base text-primary">Sign in to review.</Text>
          </Pressable>
        </Link>
      ) : (
        <>
          <Textarea
            className="mt-3"
            value={body}
            onChangeText={setBody}
            placeholder="Peaches are in, bread sold out by noon…"
          />
          <View className="mt-3 flex-row gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star === rating ? 0 : star)}>
                <Text className={cn("text-xl", star <= rating ? "text-stamp" : "text-border")}>★</Text>
              </Pressable>
            ))}
          </View>
          <Input
            className="mt-3"
            value={marketQuery || market?.name || ""}
            onChangeText={(value) => {
              setMarketQuery(value);
            }}
            placeholder="Market"
          />
          {marketQuery ? (
            <View className="border border-t-0 border-input bg-background">
              {markets
                .filter((item) => item.name.toLowerCase().includes(marketQuery.toLowerCase()))
                .slice(0, 6)
                .map((item) => (
                  <Pressable
                    key={item.id}
                    className="border-b border-border px-3 py-2"
                    onPress={() => {
                      setMarketId(item.id);
                      setMarketQuery("");
                      setVendorId("");
                    }}
                  >
                    <Text>{item.name}</Text>
                  </Pressable>
                ))}
            </View>
          ) : null}
          {stallOptions.length ? (
            <>
              <Input
                className="mt-3"
                value={vendorQuery || tagged?.name || ""}
                onChangeText={setVendorQuery}
                placeholder="Stall (optional)"
              />
              {vendorQuery ? (
                <View className="border border-t-0 border-input bg-background">
                  {stallOptions
                    .filter((stall) => stall.name.toLowerCase().includes(vendorQuery.toLowerCase()))
                    .slice(0, 8)
                    .map((stall) => (
                      <Pressable
                        key={stall.id}
                        className="border-b border-border px-3 py-2"
                        onPress={() => {
                          setVendorId(stall.id);
                          setVendorQuery("");
                        }}
                      >
                        <Text>{stall.name}</Text>
                      </Pressable>
                    ))}
                </View>
              ) : null}
            </>
          ) : null}
          {tagged ? (
            <View className="mt-3 flex-row gap-2">
              {[1, 2, 3].map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setPrice(price === level ? 0 : level)}
                  className={cn("border px-2 py-1", price === level ? "border-primary bg-secondary" : "border-border")}
                >
                  <Text>{"$".repeat(level)}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <View className="mt-3 flex-row flex-wrap gap-2">
            {FLOOR_TAGS.map((tag) => {
              const on = tags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() =>
                    setTags((current) =>
                      on ? current.filter((item) => item !== tag) : [...current, tag],
                    )
                  }
                  className={cn("border px-2 py-1", on ? "border-primary bg-secondary" : "border-border")}
                >
                  <Text className="text-sm">#{tag}</Text>
                </Pressable>
              );
            })}
          </View>
          <View className="mt-3 flex-row gap-2">
            <Button title={photos.length ? `${photos.length} photo` : "Photo"} variant="outline" onPress={() => void addPhoto()} />
            <Button title={pending ? "Posting…" : "Post"} disabled={pending} onPress={() => void submit()} />
          </View>
          {message ? <Text className="mt-2 text-sm text-stamp">{message}</Text> : null}
        </>
      )}
    </View>
  );
}
