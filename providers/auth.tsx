import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { fetchMyPublicProfile } from "@/lib/my-profile";
import { passwordUpdatePublicError, signInPublicError, signUpPublicError } from "@/lib/public-error";
import { EMPTY_SAVES, type SaveKind, type Saves } from "@/lib/saves";
import { loadMySaves, persistSave } from "@/lib/account";
import { createSupabaseClient, requireClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

WebBrowser.maybeCompleteAuthSession();

type AuthValue = {
  ready: boolean;
  user: User | null;
  profile: Profile | null;
  saves: Saves;
  configured: boolean;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; message?: string }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  toggleSave: (kind: SaveKind, slug: string) => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saves, setSaves] = useState<Saves>(EMPTY_SAVES);
  const configured = Boolean(createSupabaseClient());

  const refresh = useCallback(async () => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      setUser(null);
      setProfile(null);
      setSaves(EMPTY_SAVES);
      setReady(true);
      return;
    }
    const {
      data: { user: next },
    } = await supabase.auth.getUser();
    setUser(next);
    if (!next) {
      setProfile(null);
      setSaves(EMPTY_SAVES);
      setReady(true);
      return;
    }
    const row = await fetchMyPublicProfile(supabase as never);
    setProfile(
      row ?? {
        id: next.id,
        display_name: next.email?.split("@")[0] ?? "You",
        avatar_url: null,
        role: "user",
        username: null,
        favorite_market_slugs: [],
        onboarded_at: null,
      },
    );
    setSaves(await loadMySaves());
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
    const supabase = createSupabaseClient();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      user,
      profile,
      saves,
      configured,
      refresh,
      async signIn(email, password) {
        const supabase = requireClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return signInPublicError(error);
        await refresh();
        return null;
      },
      async signUp(email, password, displayName) {
        const supabase = requireClient();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) return signUpPublicError(error);
        await refresh();
        return { error: null };
      },
      async signOut() {
        const supabase = createSupabaseClient();
        await supabase?.auth.signOut();
        await refresh();
      },
      async signInWithGoogle() {
        const supabase = requireClient();
        const redirectTo = Linking.createURL("/auth/callback");
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error || !data.url) return "Sign-in was cancelled or did not finish. Try again.";
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type !== "success") return "Sign-in was cancelled or did not finish. Try again.";
        const url = new URL(result.url);
        const params = new URLSearchParams(url.hash.replace(/^#/, "") || url.search.replace(/^\?/, ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const code = params.get("code") ?? url.searchParams.get("code");
        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
          if (sessionError) return "Could not finish signing in. Try again.";
          await refresh();
          return null;
        }
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) return "Could not finish signing in. Try again.";
          await refresh();
          return null;
        }
        return "Could not finish signing in. Try again.";
      },
      async updatePassword(password) {
        const supabase = requireClient();
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return passwordUpdatePublicError(error);
        return null;
      },
      async toggleSave(kind, slug) {
        if (!user) return;
        const nextSaved = !saves[kind === "market" ? "markets" : "vendors"].includes(slug);
        const optimistic: Saves = {
          markets:
            kind === "market"
              ? nextSaved
                ? [...saves.markets, slug]
                : saves.markets.filter((item) => item !== slug)
              : saves.markets,
          vendors:
            kind === "vendor"
              ? nextSaved
                ? [...saves.vendors, slug]
                : saves.vendors.filter((item) => item !== slug)
              : saves.vendors,
        };
        setSaves(optimistic);
        const persisted = await persistSave(kind, slug, nextSaved);
        if (persisted) setSaves(persisted);
        else await refresh();
      },
    }),
    [configured, profile, ready, refresh, saves, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
