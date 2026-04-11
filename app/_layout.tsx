import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../src/context/AppContext";
import { CurrencyProvider } from "../src/context/CurrencyContext";
import { LanguageProvider } from "../src/context/LanguageContext";
import { supabase } from "../src/lib/supabase";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Restore session on app launch, then redirect to onboarding if incomplete
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .single();

        if (profile && !profile.onboarding_completed) {
          setReady(true);
          router.replace("/onboarding" as any);
          return;
        }
      }
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

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
