import { Image } from "expo-image";
import { SITE_WORDMARK, SITE_WORDMARK_GREEN } from "@/lib/constants";

export function SiteWordmark({
  className,
  green,
}: {
  className?: string;
  green?: boolean;
}) {
  return (
    <Image
      source={green ? SITE_WORDMARK_GREEN : SITE_WORDMARK}
      contentFit="contain"
      style={{ height: 20, width: 134 }}
      className={className}
      accessibilityLabel="MarketRegular"
    />
  );
}
