import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { requireClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const { refresh } = useAuth();

  useEffect(() => {
    void (async () => {
      try {
        const supabase = requireClient();
        if (typeof params.code === "string" && params.code) {
          await supabase.auth.exchangeCodeForSession(params.code);
        }
        await refresh();
      } finally {
        router.replace("/account");
      }
    })();
  }, [params.code, refresh, router]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-muted-foreground">Finishing sign-in…</Text>
    </View>
  );
}
