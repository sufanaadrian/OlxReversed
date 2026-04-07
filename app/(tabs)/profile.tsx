import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useCurrency } from "../../src/context/CurrencyContext";
import { useLanguage, useTranslation } from "../../src/context/LanguageContext";
import { supabase } from "../../src/lib/supabase";
import { styles, theme } from "./profile.styles";

export default function ProfileScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const t = useTranslation();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const onAuthButtonPress = async () => {
    if (email) {
      // LOG OUT
      setEmail(null); // immediate UI update
      await supabase.auth.signOut();
      return;
    }

    // SIGN IN (optional redirect back to profile)
    router.push({
      pathname: "/sign-in",
      params: { redirect: "/(tabs)/profile" },
    } as any);
  };

  const isLoggedIn = !!email;

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>{t("profile")}</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(email?.[0] ?? "U").toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{isLoggedIn ? t("user") : t("guest")}</Text>
          <Text style={styles.email}>{email ?? t("notSignedIn")}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t("requests")}</Text>
          <Text style={styles.statValue}>0</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t("deals")}</Text>
          <Text style={styles.statValue}>0</Text>
        </View>
      </View>

      {/* Language Selection */}
      <View style={styles.settingSection}>
        <Text style={styles.sectionTitle}>{t("language")}</Text>
        <View style={styles.languageButtons}>
          <Pressable
            style={[
              styles.languageBtn,
              language === "en" && styles.languageBtnActive,
            ]}
            onPress={() => setLanguage("en")}
          >
            <Text
              style={[
                styles.languageBtnText,
                language === "en" && styles.languageBtnTextActive,
              ]}
            >
              🇬🇧 English
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.languageBtn,
              language === "ro" && styles.languageBtnActive,
            ]}
            onPress={() => setLanguage("ro")}
          >
            <Text
              style={[
                styles.languageBtnText,
                language === "ro" && styles.languageBtnTextActive,
              ]}
            >
              🇷🇴 Română
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Currency Selection */}
      <View style={styles.settingSection}>
        <Text style={styles.sectionTitle}>{t("currency")}</Text>
        <View style={styles.languageButtons}>
          <Pressable
            style={[
              styles.languageBtn,
              currency === "ron" && styles.languageBtnActive,
            ]}
            onPress={() => setCurrency("ron")}
          >
            <Text
              style={[
                styles.languageBtnText,
                currency === "ron" && styles.languageBtnTextActive,
              ]}
            >
              {t("ron")}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.languageBtn,
              currency === "eur" && styles.languageBtnActive,
            ]}
            onPress={() => setCurrency("eur")}
          >
            <Text
              style={[
                styles.languageBtnText,
                currency === "eur" && styles.languageBtnTextActive,
              ]}
            >
              {t("eur")}
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.authBtn} onPress={onAuthButtonPress}>
        <Feather
          name={isLoggedIn ? "log-out" : "log-in"}
          size={18}
          color={theme.primaryText}
        />
        <Text style={styles.authText}>
          {isLoggedIn ? t("logOut") : t("signIn")}
        </Text>
      </Pressable>

      <Text style={styles.version}>{t("version")} 1.0.0</Text>
    </View>
  );
}
