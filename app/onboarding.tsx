import { useRouter, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { BackHeader } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeOnboarding, usernameAvailable } from "@/lib/account";
import { safePath } from "@/lib/auth-redirect";
import { normalizeUsername, usernameError } from "@/lib/username";
import { useAuth } from "@/providers/auth";
import { useDirectory } from "@/providers/directory";
import { cn } from "@/lib/utils";

export default function OnboardingScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const router = useRouter();
  const { refresh, user } = useAuth();
  const { markets } = useDirectory();
  const [username, setUsername] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const after = safePath(next, "/account");

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return markets
      .filter((market) => !needle || market.name.toLowerCase().includes(needle) || market.city.toLowerCase().includes(needle))
      .slice(0, 12);
  }, [markets, query]);

  function toggle(slug: string) {
    setPicked((current) => {
      if (current.includes(slug)) return current.filter((item) => item !== slug);
      if (current.length >= 3) return current;
      return [...current, slug];
    });
  }

  async function submit() {
    const handle = normalizeUsername(username);
    const format = usernameError(handle);
    if (format) {
      setError(format);
      return;
    }
    if (picked.length !== 3) {
      setError("Pick three different markets.");
      return;
    }
    if (!user) {
      router.replace("/login?next=/onboarding");
      return;
    }
    setPending(true);
    const taken = await usernameAvailable(handle, user.id);
    if (!taken.available) {
      setPending(false);
      setError(taken.error ?? "That handle is taken.");
      return;
    }
    const result = await completeOnboarding({ username: handle, favoriteSlugs: picked });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    await refresh();
    router.replace(after as Href);
  }

  useEffect(() => {
    if (!user) router.replace("/login?next=/onboarding");
  }, [router, user]);

  return (
    <View className="flex-1 bg-background">
      <BackHeader title="Set up" />
      <ScrollView contentContainerClassName="px-4 py-6 pb-10">
        <Text className="font-heading text-3xl">Pick a handle</Text>
        <Input className="mt-4" autoCapitalize="none" value={username} onChangeText={setUsername} placeholder="@handle" />
        <Text className="mt-8 font-heading text-xl">Three favorite halls</Text>
        <Input className="mt-3" value={query} onChangeText={setQuery} placeholder="Search markets" />
        {picked.map((slug) => {
          const market = markets.find((item) => item.slug === slug);
          return (
            <Pressable key={slug} onPress={() => toggle(slug)} className="mt-2 bg-secondary px-3 py-2">
              <Text>{market?.name ?? slug}</Text>
            </Pressable>
          );
        })}
        {matches.map((market) => (
          <Pressable
            key={market.id}
            onPress={() => toggle(market.slug)}
            className={cn("border-b border-border py-3", picked.includes(market.slug) && "bg-secondary")}
          >
            <Text className="font-heading text-base">{market.name}</Text>
            <Text className="text-sm text-muted-foreground">{market.city}</Text>
          </Pressable>
        ))}
        {error ? <Text className="mt-3 text-sm text-stamp">{error}</Text> : null}
        <Button className="mt-6" title={pending ? "Saving…" : "Finish"} disabled={pending} onPress={() => void submit()} />
      </ScrollView>
    </View>
  );
}
