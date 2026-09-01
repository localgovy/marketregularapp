import { Link, useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { BackHeader } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SITE_NAME } from "@/lib/constants";
import { needsOnboarding, onboardingHref } from "@/lib/onboarding";
import { useAuth } from "@/providers/auth";
import { useDirectory } from "@/providers/directory";

export default function AccountScreen() {
  const router = useRouter();
  const { user, profile, saves, signOut, updatePassword, ready } = useAuth();
  const { markets, vendors } = useDirectory();
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordOk, setPasswordOk] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login?next=/account");
      return;
    }
    if (needsOnboarding(profile)) {
      router.replace(onboardingHref("/account") as Href);
    }
  }, [profile, ready, router, user]);

  if (!ready || !user) {
    return (
      <View className="flex-1 bg-background">
        <BackHeader title="Account" />
        <Text className="p-4 text-muted-foreground">Loading…</Text>
      </View>
    );
  }

  const savedMarkets = markets.filter((market) => saves.markets.includes(market.slug));
  const savedVendors = vendors.filter((vendor) => saves.vendors.includes(vendor.slug));

  return (
    <View className="flex-1 bg-background">
      <BackHeader title="Account" />
      <ScrollView contentContainerClassName="px-4 py-6 pb-10">
        <Text className="font-heading text-3xl">{profile?.username ? `@${profile.username}` : SITE_NAME}</Text>
        <Text className="mt-1 text-muted-foreground">{user.email}</Text>
        <Link href="/saved" asChild>
          <Pressable className="mt-6">
            <Text className="text-primary">
              {savedMarkets.length} halls · {savedVendors.length} stalls saved
            </Text>
          </Pressable>
        </Link>
        <Text className="mt-8 font-heading text-xl">Password</Text>
        <Input className="mt-3" secureTextEntry value={password} onChangeText={setPassword} placeholder="New password" />
        {passwordError ? <Text className="mt-2 text-sm text-stamp">{passwordError}</Text> : null}
        {passwordOk ? <Text className="mt-2 text-sm text-primary">Password updated.</Text> : null}
        <Button
          className="mt-3"
          title="Update password"
          variant="outline"
          onPress={async () => {
            setPasswordOk(false);
            const result = await updatePassword(password);
            if (result) setPasswordError(result);
            else {
              setPasswordError(null);
              setPasswordOk(true);
              setPassword("");
            }
          }}
        />
        <Link href="/contact" asChild>
          <Pressable className="mt-8">
            <Text className="text-primary">Contact</Text>
          </Pressable>
        </Link>
        <Button
          className="mt-8"
          title="Sign out"
          variant="destructive"
          onPress={async () => {
            await signOut();
            router.replace("/");
          }}
        />
      </ScrollView>
    </View>
  );
}
