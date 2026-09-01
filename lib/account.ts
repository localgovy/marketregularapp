import { dbPublicError } from "@/lib/public-error";
import { EMPTY_SAVES, toSaves, type SaveKind, type Saves } from "@/lib/saves";
import { requireClient } from "@/lib/supabase/client";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_SAVES = 200;

function validSlug(slug: string) {
  return slug.length >= 1 && slug.length <= 160 && SLUG.test(slug);
}

export async function loadMySaves(): Promise<Saves> {
  const supabase = requireClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY_SAVES;
  const { data, error } = await supabase.from("saves").select("kind, slug").eq("user_id", user.id);
  if (error) return EMPTY_SAVES;
  return toSaves(data);
}

export async function persistSave(kind: SaveKind, slug: string, saved: boolean): Promise<Saves | null> {
  if (!validSlug(slug)) return null;
  const supabase = requireClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  if (saved) {
    const current = await loadMySaves();
    const list = kind === "market" ? current.markets : current.vendors;
    if (list.length >= MAX_SAVES && !list.includes(slug)) return current;
    const { error } = await supabase.from("saves").insert({ user_id: user.id, kind, slug });
    if (error && error.code !== "23505") return null;
  } else {
    const { error } = await supabase
      .from("saves")
      .delete()
      .eq("user_id", user.id)
      .eq("kind", kind)
      .eq("slug", slug);
    if (error) return null;
  }
  return loadMySaves();
}

export async function completeOnboarding(input: {
  username: string;
  favoriteSlugs: string[];
}) {
  const supabase = requireClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };
  if (input.favoriteSlugs.length !== 3 || new Set(input.favoriteSlugs).size !== 3) {
    return { error: "Pick three different markets." };
  }
  if (!input.favoriteSlugs.every(validSlug)) return { error: "Those markets are not valid." };

  const rows = input.favoriteSlugs.map((slug) => ({
    user_id: user.id,
    kind: "market" as const,
    slug,
  }));
  const { error: saveError } = await supabase.from("saves").upsert(rows, {
    onConflict: "user_id,kind,slug",
    ignoreDuplicates: true,
  });
  if (saveError) return { error: dbPublicError(saveError, "Could not save those markets.") };

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({
      username: input.username,
      favorite_market_slugs: input.favoriteSlugs,
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") return { error: "That handle is taken." };
    return { error: dbPublicError(error, "Could not finish setting up this account.") };
  }
  if (!updated) {
    const meta = user.user_metadata ?? {};
    const fromMeta = [meta.display_name, meta.full_name, meta.name].find(
      (value) => typeof value === "string" && value.trim(),
    );
    const displayName =
      (typeof fromMeta === "string" ? fromMeta.trim() : "") ||
      user.email?.split("@")[0] ||
      "Regular";
    const avatar =
      (typeof meta.avatar_url === "string" && meta.avatar_url) ||
      (typeof meta.picture === "string" && meta.picture) ||
      null;
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      display_name: displayName,
      avatar_url: avatar,
      username: input.username,
      favorite_market_slugs: input.favoriteSlugs,
    });
    if (insertError) {
      if (insertError.code === "23505") return { error: "That handle is taken." };
      return { error: dbPublicError(insertError, "Could not finish setting up this account.") };
    }
  }

  const { data: stamped, error: stampError } = await supabase.rpc("stamp_onboarded_at");
  if (stampError || !stamped) {
    return { error: "Could not finish setting up this account. Try again." };
  }
  return { error: null as string | null };
}

export async function usernameAvailable(raw: string, userId: string) {
  const supabase = requireClient();
  const { data, error } = await supabase.from("profiles").select("id").eq("username", raw).maybeSingle();
  if (error) return { available: false as const, error: "Could not check that handle." };
  if (data && data.id !== userId) return { available: false as const, error: "That handle is taken." };
  return { available: true as const, error: null as string | null };
}
