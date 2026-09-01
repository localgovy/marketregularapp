import { Link, usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SiteWordmark } from "@/components/site-wordmark";
import { useAuth } from "@/providers/auth";
import { cn } from "@/lib/utils";

export function PaperHeader() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const label = profile?.username ? `@${profile.username}` : user ? "Account" : "Sign in";

  return (
    <View style={{ paddingTop: insets.top }} className="border-b-2 border-board bg-board">
      <View className="h-14 flex-row items-center justify-between px-4">
        <Link href="/" asChild>
          <Pressable>
            <SiteWordmark />
          </Pressable>
        </Link>
        <Link href={user ? "/account" : "/login"} asChild>
          <Pressable className="border border-chalk/30 px-2 py-1">
            <Text className="text-sm text-chalk">{label}</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

export function PaperTabBar({
  state,
  navigation,
}: {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  navigation: {
    navigate: (name: string) => void;
    emit: (event: { type: string; target?: string; canPreventDefault?: boolean }) => {
      defaultPrevented: boolean;
    };
  };
}) {
  const insets = useSafeAreaInsets();
  const labels: Record<string, string> = {
    index: "Home",
    events: "Events",
    markets: "Find",
    feed: "Feed",
    saved: "Saved",
  };

  return (
    <View
      style={{ paddingBottom: insets.bottom }}
      className="border-t border-border bg-secondary"
    >
      <View className="h-12 flex-row divide-x divide-border border-b border-border">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name as never);
                }
              }}
              className={cn(
                "flex-1 items-center justify-center",
                focused ? "bg-card" : "bg-secondary",
              )}
            >
              <Text
                className={cn(
                  "text-[11px] font-medium",
                  focused ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {labels[route.name] ?? route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function BackHeader({ title }: { title: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  return (
    <View style={{ paddingTop: insets.top }} className="border-b border-border bg-background">
      <View className="h-14 flex-row items-center gap-3 px-4">
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}>
          <Text className="text-sm font-medium text-primary">Back</Text>
        </Pressable>
        <Text numberOfLines={1} className="flex-1 font-heading text-lg text-foreground">
          {title || pathname}
        </Text>
      </View>
    </View>
  );
}
