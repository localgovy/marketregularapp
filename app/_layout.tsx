import "../global.css";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SchibstedGrotesk_400Regular, SchibstedGrotesk_600SemiBold } from "@expo-google-fonts/schibsted-grotesk";
import { MonaSans_600SemiBold } from "@expo-google-fonts/mona-sans";
import { BarlowCondensed_800ExtraBold } from "@expo-google-fonts/barlow-condensed";
import { isSupabaseConfigured } from "@/lib/constants";
import { AuthProvider } from "@/providers/auth";
import { DayPlanProvider } from "@/providers/day-plan";
import { DirectoryProvider } from "@/providers/directory";
import { GeoProvider } from "@/providers/geo";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SchibstedGrotesk_400Regular,
    SchibstedGrotesk_600SemiBold,
    MonaSans_600SemiBold,
    BarlowCondensed_800ExtraBold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  if (!isSupabaseConfigured()) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <StatusBar style="dark" />
        <Text className="font-heading text-2xl text-foreground">MarketRegular isn’t configured.</Text>
        <Text className="mt-3 text-center text-base text-muted-foreground">
          Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then reload.
        </Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <DirectoryProvider>
        <GeoProvider>
          <DayPlanProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f4f1ea" } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="markets/[slug]" />
              <Stack.Screen name="vendors/[slug]" />
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="account" />
              <Stack.Screen name="contact" />
              <Stack.Screen name="auth/callback" />
            </Stack>
          </DayPlanProvider>
        </GeoProvider>
      </DirectoryProvider>
    </AuthProvider>
  );
}
