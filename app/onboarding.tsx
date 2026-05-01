import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useTranslation } from "../src/context/LanguageContext";
import { supabase } from "../src/lib/supabase";
import { styles, theme } from "./onboarding.styles";

type UserType = "student" | "employer" | "both";

export default function OnboardingScreen() {
  const t = useTranslation();
  const [userType, setUserType] = useState<UserType | null>(null);
  const [university, setUniversity] = useState("");
  const [studyYear, setStudyYear] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    if (!userType) {
      Alert.alert(t("error"), t("selectRoleRequired"));
      return;
    }
    if (!termsAccepted) {
      Alert.alert(t("error"), t("acceptTermsFirst"));
      return;
    }

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/sign-in");
      return;
    }

    const updates: Record<string, unknown> = {
      user_type: userType,
      onboarding_completed: true,
    };
    if (university.trim()) updates.university = university.trim();
    if (studyYear.trim()) updates.study_year = parseInt(studyYear, 10);

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    setLoading(false);
    if (error) {
      Alert.alert(t("error"), error.message);
    } else {
      router.replace("/(tabs)/marketplace" as any);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.emoji}>🎓</Text>
          <Text style={styles.heroTitle}>{t("welcomeToStudentJobs")}</Text>
          <Text style={styles.heroSubtitle}>{t("onboardingSubtitle")}</Text>
        </View>

        {/* Role selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("iAm")}</Text>
          <View style={styles.roleGrid}>
            {[
              { key: "student" as UserType, icon: "📚" },
              { key: "employer" as UserType, icon: "🏢" },
              { key: "both" as UserType, icon: "🤝" },
            ].map(({ key, icon }) => (
              <Pressable
                key={key}
                style={[
                  styles.roleCard,
                  userType === key && styles.roleCardSelected,
                ]}
                onPress={() => setUserType(key)}
              >
                <Text style={styles.roleIcon}>{icon}</Text>
                <Text
                  style={[
                    styles.roleLabel,
                    userType === key && styles.roleLabelSelected,
                  ]}
                >
                  {t(key)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Student details (optional) */}
        {(userType === "student" || userType === "both") && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("studentDetails")}</Text>
            <TextInput
              style={styles.input}
              value={university}
              onChangeText={setUniversity}
              placeholder={t("universityPlaceholder")}
              placeholderTextColor={theme.mutedText}
            />
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              value={studyYear}
              onChangeText={setStudyYear}
              placeholder={t("studyYearPlaceholder")}
              placeholderTextColor={theme.mutedText}
              keyboardType="numeric"
              maxLength={1}
            />
          </View>
        )}

        {/* Terms */}
        <Pressable
          style={styles.termsRow}
          onPress={() => setTermsAccepted((v) => !v)}
        >
          <View
            style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}
          >
            {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>{t("acceptTerms")}</Text>
        </Pressable>

        <Pressable
          style={[
            styles.submitBtn,
            (!userType || !termsAccepted || loading) &&
              styles.submitBtnDisabled,
          ]}
          onPress={handleFinish}
          disabled={!userType || !termsAccepted || loading}
        >
          <Text style={styles.submitBtnText}>
            {loading ? t("saving") : t("getStarted")}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
