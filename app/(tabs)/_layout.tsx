import { Tabs } from "expo-router";
import { PaperHeader, PaperTabBar } from "@/components/chrome";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <PaperTabBar state={props.state} navigation={props.navigation as never} />
      )}
      screenOptions={{
        header: () => <PaperHeader />,
        sceneStyle: { backgroundColor: "#f4f1ea" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="events" options={{ title: "Events" }} />
      <Tabs.Screen name="markets" options={{ title: "Find Markets" }} />
      <Tabs.Screen name="feed" options={{ title: "Feed" }} />
      <Tabs.Screen name="saved" options={{ title: "Saved" }} />
    </Tabs>
  );
}
