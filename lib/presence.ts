import { encodeFloorBody } from "@/lib/floor-note";
import { allowedPostPhotos } from "@/lib/post-photos";
import { dbPublicError } from "@/lib/public-error";
import { requireClient } from "@/lib/supabase/client";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createPost(input: {
  marketId: string;
  body: string;
  lat?: number;
  lng?: number;
  photos?: string[];
  tags?: string[];
  vendorSlug?: string;
  rating?: number;
  priceLevel?: number;
}) {
  const body = encodeFloorBody(
    input.body,
    input.tags ?? [],
    input.vendorSlug,
    input.rating,
    input.vendorSlug ? input.priceLevel : undefined,
  );
  if (input.body.trim().length < 3) return { error: "Write a little more." };
  if (body.length > 2000) return { error: "Reviews are limited to 2,000 characters." };

  const supabase = requireClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to review." };
  if (!UUID.test(input.marketId)) return { error: "Pick a market." };

  const photos = allowedPostPhotos(user.id, input.photos ?? []);
  if (!photos) return { error: "Those photos could not be attached." };

  const { count } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString());
  if ((count ?? 0) >= 10) {
    return { error: "Daily review limit reached. See you tomorrow." };
  }

  const { data: inserted, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      market_id: input.marketId,
      body,
      photos,
      verified_on_site: false,
    })
    .select("id")
    .single();
  if (error) {
    if (error.message.includes("Daily review limit")) {
      return { error: "Daily review limit reached. See you tomorrow." };
    }
    return { error: dbPublicError(error, "Could not post that review.") };
  }

  if (inserted && typeof input.lat === "number" && typeof input.lng === "number") {
    await supabase.rpc("confirm_on_site", {
      p_post_id: inserted.id,
      p_lat: input.lat,
      p_lng: input.lng,
    });
  }
  return { error: null as string | null };
}

export async function composeFloorNote(input: {
  marketId: string;
  body: string;
  lat?: number;
  lng?: number;
  rating: number;
  vendorId?: string;
  vendorSlug?: string;
  tags: string[];
  priceLevel?: number;
  photos?: string[];
}) {
  return createPost({
    marketId: input.marketId,
    body: input.body,
    lat: input.lat,
    lng: input.lng,
    photos: input.photos,
    tags: input.tags,
    vendorSlug: input.vendorSlug,
    rating: input.rating >= 1 ? input.rating : undefined,
    priceLevel:
      input.vendorId && input.priceLevel && input.priceLevel >= 1 && input.priceLevel <= 3
        ? input.priceLevel
        : undefined,
  });
}

export async function uploadPostPhoto(uri: string, userId: string) {
  const supabase = requireClient();
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const path = `${userId}/${name}`;
  const response = await fetch(uri);
  const blob = await response.blob();
  const { error } = await supabase.storage.from("post-photos").upload(path, blob, {
    contentType: blob.type || "image/jpeg",
    upsert: false,
  });
  if (error) return { error: "Those photos could not be attached.", url: null as string | null };
  const { data } = supabase.storage.from("post-photos").getPublicUrl(path);
  return { error: null as string | null, url: data.publicUrl };
}
