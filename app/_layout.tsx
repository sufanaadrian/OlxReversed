import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../src/context/AppContext";
import { CurrencyProvider } from "../src/context/CurrencyContext";
import { LanguageProvider } from "../src/context/LanguageContext";
import { supabase } from "../src/lib/supabase";

export default function RootLayout() {
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!session?.user) {
          router.replace("/sign-in" as any);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .single();
        if (!profile?.onboarding_completed) {
          router.replace("/onboarding" as any);
        }
      })
      .catch(() => {
        router.replace("/sign-in" as any);
      });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <AppProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="(modals)"
                  options={{ presentation: "modal" }}
                />
                <Stack.Screen name="sign-in" />
                <Stack.Screen name="sign-up" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="forgot-password" />
              </Stack>
            </AppProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
