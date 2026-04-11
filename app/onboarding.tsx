import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { Screen } from "../src/components/Screen";
import { useTranslation } from "../src/context/LanguageContext";
import { supabase } from "../src/lib/supabase";
import { styles } from "./onboarding.styles";

const CATEGORIES = [
  "vehicles",
  "realEstate",
  "services",
  "electronics",
  "fashion",
  "other",
] as const;

const TERMS_VERSION = "1.0";
const PRIVACY_VERSION = "1.0";

export default function OnboardingScreen() {
  const t = useTranslation();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const onFinish = async () => {
    setMsg("");

    if (!termsAccepted) {
      setMsg(t("mustAcceptTerms"));
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setMsg(t("pleaseSignInGeneric"));
      return;
    }

    // Save categories (if any selected)
    if (selectedCategories.length > 0) {
      const rows = selectedCategories.flatMap((cat) => [
        { user_id: user.id, category: cat, type: "buy" },
        { user_id: user.id, category: cat, type: "sell" },
      ]);

      const { error: catError } = await supabase
        .from("user_categories")
        .upsert(rows, { onConflict: "user_id,category,type" });

      if (catError) {
        setLoading(false);
        setMsg(t("profileSaveFailed"));
        return;
      }
    }

    // Save consent
    const { error: consentError } = await supabase
      .from("user_consents")
      .insert({
        user_id: user.id,
        terms_version: TERMS_VERSION,
        privacy_version: PRIVACY_VERSION,
      });

    if (consentError) {
      setLoading(false);
      setMsg(t("profileSaveFailed"));
      return;
    }

    // Mark onboarding completed
    await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // Insert default preferences
    await supabase
      .from("user_preferences")
      .upsert(
        { user_id: user.id, notifications: true },
        { onConflict: "user_id" },
      );

    setLoading(false);

    Alert.alert(t("registrationComplete"), t("welcomeMessage"), [
      {
        text: t("goToMarketplaceBtn"),
        onPress: () => router.replace("/(tabs)/marketplace" as any),
      },
    ]);
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{t("step2of2")}</Text>
          </View>

          <Text style={styles.h1}>{t("almostDone")}</Text>
          <Text style={styles.subtitle}>{t("selectCategoriesHint")}</Text>

          {/* ─── Categories ──────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("selectCategories")}</Text>
            <Text style={styles.sectionHint}>{t("selectCategoriesHint")}</Text>

            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat);
                return (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryChip,
                      active && styles.categoryChipActive,
                    ]}
                    onPress={() => toggleCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        active && styles.categoryChipTextActive,
                      ]}
                    >
                      {t(cat)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.skipBtn}>
              <Text style={styles.skipBtnText}>{t("skipForNow")}</Text>
            </Pressable>
          </View>

          {/* ─── Terms & Privacy ─────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("termsAndPrivacy")}</Text>

            <Pressable
              style={styles.termsRow}
              onPress={() => setTermsAccepted((v) => !v)}
            >
              <View
                style={[
                  styles.checkbox,
                  termsAccepted && styles.checkboxActive,
                ]}
              >
                {termsAccepted && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                {t("iAcceptThe")}{" "}
                <Text style={styles.termsLink}>{t("termsOfService")}</Text>{" "}
                {t("and")}{" "}
                <Text style={styles.termsLink}>{t("privacyPolicy")}</Text>
              </Text>
            </Pressable>
          </View>

          {!!msg && <Text style={styles.errorMsg}>{msg}</Text>}

          <Pressable
            style={[styles.finishBtn, loading && styles.finishBtnDisabled]}
            onPress={onFinish}
            disabled={loading}
          >
            <Text style={styles.finishBtnText}>
              {loading ? t("working") : t("finishRegistration")}
            </Text>
          </Pressable>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
