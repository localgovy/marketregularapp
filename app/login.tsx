import { Link, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { BackHeader } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SITE_NAME } from "@/lib/constants";
import { safePath } from "@/lib/auth-redirect";
import { needsOnboarding, onboardingHref } from "@/lib/onboarding";
import { useAuth } from "@/providers/auth";

export default function LoginScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const router = useRouter();
  const { signIn, signInWithGoogle, profile, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const after = safePath(next, "/account");

  useEffect(() => {
    if (user) {
      router.replace((needsOnboarding(profile) ? onboardingHref(after) : after) as Href);
    }
  }, [after, profile, router, user]);

  async function submit() {
    setPending(true);
    setError(null);
    const result = await signIn(email.trim(), password);
    setPending(false);
    if (result) {
      setError(result);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <BackHeader title="Sign in" />
      <ScrollView contentContainerClassName="px-4 py-6">
        <Text className="font-heading text-3xl">{SITE_NAME}</Text>
        <Text className="mt-2 text-base text-muted-foreground">Sign in to save halls and post from the floor.</Text>
        <Input
          className="mt-6"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
        />
        <Input
          className="mt-3"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
        />
        {error ? <Text className="mt-3 text-sm text-stamp">{error}</Text> : null}
        <Button className="mt-4" title={pending ? "Signing in…" : "Sign in"} disabled={pending} onPress={() => void submit()} />
        <Button
          className="mt-3"
          title="Continue with Google"
          variant="outline"
          onPress={async () => {
            setPending(true);
            const result = await signInWithGoogle();
            setPending(false);
            if (result) setError(result);
          }}
        />
        <Link href={`/signup?next=${encodeURIComponent(after)}`} asChild>
          <Pressable className="mt-6">
            <Text className="text-primary">Create an account</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </View>
  );
}
