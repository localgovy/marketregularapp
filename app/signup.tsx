import { Link, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { BackHeader } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { safePath } from "@/lib/auth-redirect";
import { needsOnboarding, onboardingHref } from "@/lib/onboarding";
import { useAuth } from "@/providers/auth";

export default function SignupScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const router = useRouter();
  const { signUp, user, profile } = useAuth();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const after = safePath(next, "/account");

  useEffect(() => {
    if (user) {
      router.replace((needsOnboarding(profile) ? onboardingHref(after) : after) as Href);
    }
  }, [after, profile, router, user]);

  async function submit() {
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords do not match.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await signUp(email.trim(), password, displayName.trim());
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.message) setMessage(result.message);
  }

  return (
    <View className="flex-1 bg-background">
      <BackHeader title="Create account" />
      <ScrollView contentContainerClassName="px-4 py-6">
        <Text className="font-heading text-3xl">Join MarketRegular</Text>
        <Input className="mt-6" value={displayName} onChangeText={setDisplayName} placeholder="Name" />
        <Input
          className="mt-3"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
        />
        <Input className="mt-3" secureTextEntry value={password} onChangeText={setPassword} placeholder="Password" />
        <Input className="mt-3" secureTextEntry value={confirm} onChangeText={setConfirm} placeholder="Confirm password" />
        {error ? <Text className="mt-3 text-sm text-stamp">{error}</Text> : null}
        {message ? <Text className="mt-3 text-sm text-muted-foreground">{message}</Text> : null}
        <Button className="mt-4" title={pending ? "Creating…" : "Create account"} disabled={pending} onPress={() => void submit()} />
        <Link href={`/login?next=${encodeURIComponent(after)}`} asChild>
          <Pressable className="mt-6">
            <Text className="text-primary">Already have an account? Sign in</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </View>
  );
}
