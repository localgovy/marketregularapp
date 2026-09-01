import { Linking, Text, View } from "react-native";
import { BackHeader } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { CLAIM_INBOX, CONTACT_NAME, SITE_NAME } from "@/lib/constants";

export default function ContactScreen() {
  return (
    <View className="flex-1 bg-background">
      <BackHeader title="Contact" />
      <View className="px-4 py-6">
        <Text className="font-heading text-3xl">{SITE_NAME}</Text>
        <Text className="mt-3 text-base leading-snug text-muted-foreground">
          Questions about a hall, a stall, or a claim go to {CONTACT_NAME}.
        </Text>
        <Button className="mt-6" title={CLAIM_INBOX} onPress={() => void Linking.openURL(`mailto:${CLAIM_INBOX}`)} />
      </View>
    </View>
  );
}
