import { router } from "expo-router";
import { supabase } from "./supabase";

type GuardResult = { ok: true; userId: string } | { ok: false };

/**
 * Call before any action that requires authentication.
 * If not signed in → redirects to sign-in and returns { ok: false }.
 * If signed in but onboarding not complete → redirects to onboarding and returns { ok: false }.
 * Otherwise returns { ok: true, userId }.
 */
export async function requireAuth(redirectBack?: string): Promise<GuardResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    router.push({
      pathname: "/sign-in",
      params: redirectBack ? { redirect: redirectBack } : {},
    } as any);
    return { ok: false };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", session.user.id)
    .single();

  if (profileError || !profile || !profile.onboarding_completed) {
    router.replace("/onboarding" as any);
    return { ok: false };
  }

  return { ok: true, userId: session.user.id };
}
