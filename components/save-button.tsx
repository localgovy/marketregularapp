import { Button } from "@/components/ui/button";
import { isSaved, type SaveKind } from "@/lib/saves";
import { useAuth } from "@/providers/auth";
import { usePathname, useRouter } from "expo-router";

export function SaveButton({ kind, slug }: { kind: SaveKind; slug: string }) {
  const { user, saves, toggleSave } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const saved = isSaved(kind, slug, saves);
  return (
    <Button
      title={saved ? "Saved" : "Save"}
      variant={saved ? "secondary" : "outline"}
      onPress={() => {
        if (!user) {
          router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
          return;
        }
        void toggleSave(kind, slug);
      }}
    />
  );
}
