import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../src/context/AppContext";
import { CurrencyProvider } from "../src/context/CurrencyContext";
import { LanguageProvider } from "../src/context/LanguageContext";
import { MarketplaceModeProvider } from "../src/context/MarketplaceModeContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import { supabase } from "../src/lib/supabase";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!session?.user) {
          router.replace("/welcome" as any);
          SplashScreen.hideAsync();
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .single();
        SplashScreen.hideAsync();
        if (!profile?.onboarding_completed) {
          router.replace("/onboarding" as any);
        } else {
          router.replace("/(tabs)/marketplace" as any);
        }
      })
      .catch(() => {
        router.replace("/welcome" as any);
        SplashScreen.hideAsync();
      });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <MarketplaceModeProvider>
                <AppProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                      name="(modals)"
                      options={{ presentation: "modal" }}
                    />
                    <Stack.Screen name="welcome" />
                    <Stack.Screen name="sign-in" />
                    <Stack.Screen name="sign-up" />
                    <Stack.Screen name="onboarding" />
                    <Stack.Screen name="forgot-password" />
                  </Stack>
                </AppProvider>
              </MarketplaceModeProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
