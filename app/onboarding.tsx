import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  TextInput,
} from "react-native";
import { useTranslation } from "../src/context/LanguageContext";
import { useTheme } from "../src/context/ThemeContext";
import { supabase } from "../src/lib/supabase";
import { makeStyles } from "./onboarding.styles";

type UserType = "student" | "employer" | "both";

const STUDENT_SKILLS = [
  "JavaScript",
  "Python",
  "Design",
  "Marketing",
  "Excel",
  "Sales",
  "Writing",
  "Photography",
  "Video",
  "Customer Service",
];

function ProgressDots({ step, total }: { step: number; total: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === step - 1 && styles.dotActive,
            i < step - 1 && styles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useTranslation();

  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<UserType | null>(null);

  // Step 2 — student
  const [university, setUniversity] = useState("");
  const [studyYear, setStudyYear] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Step 2 — employer
  const [companyName, setCompanyName] = useState("");
  const [lookingFor, setLookingFor] = useState("");

  // Step 3
  const [displayName, setDisplayName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  }

  function nextStep() {
    if (step === 1 && !userType) {
      Alert.alert(t("error"), t("selectRoleRequired"));
      return;
    }
    setStep((s) => s + 1);
  }

  function prevStep() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleFinish() {
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
    if (displayName.trim()) updates.username = displayName.trim();
    if (university.trim()) updates.university = university.trim();
    if (studyYear.trim()) updates.study_year = parseInt(studyYear, 10);
    if (selectedSkills.length) updates.skills = selectedSkills;
    if (companyName.trim()) updates.company_name = companyName.trim();

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

  const isEmployer = userType === "employer";
  const isStudent = userType === "student" || userType === "both";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ProgressDots step={step} total={3} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button for steps 2+ */}
        <View style={styles.navRow}>
          {step > 1 && (
            <Pressable style={styles.backBtn} onPress={prevStep}>
              <Feather name="arrow-left" size={14} color={colors.secondaryText} />
              <Text style={styles.backBtnText}>{t("onboardingBack")}</Text>
            </Pressable>
          )}
        </View>

        {/* ── STEP 1: Who are you? ────────────────────────────────── */}
        {step === 1 && (
          <>
            <View style={styles.header}>
              <Text style={styles.emoji}>👋</Text>
              <Text style={styles.headerTitle}>{t("onboardingStep1Title")}</Text>
              <Text style={styles.headerSubtitle}>{t("onboardingSubtitle")}</Text>
            </View>

            <View style={styles.roleGrid}>
              {(
                [
                  {
                    key: "student" as UserType,
                    emoji: "📚",
                    labelKey: "student",
                    descKey: "studentRoleDesc",
                    isEmp: false,
                  },
                  {
                    key: "employer" as UserType,
                    emoji: "🏢",
                    labelKey: "employer",
                    descKey: "employerRoleDesc",
                    isEmp: true,
                  },
                  {
                    key: "both" as UserType,
                    emoji: "🤝",
                    labelKey: "both",
                    descKey: "bothRoleDesc",
                    isEmp: false,
                  },
                ] as const
              ).map(({ key, emoji, labelKey, descKey, isEmp }) => {
                const selected = userType === key;
                return (
                  <Pressable
                    key={key}
                    style={[
                      styles.roleCard,
                      selected && (isEmp ? styles.roleCardEmployerSelected : styles.roleCardSelected),
                    ]}
                    onPress={() => setUserType(key)}
                  >
                    <Text style={styles.roleEmoji}>{emoji}</Text>
                    <View style={styles.roleContent}>
                      <Text
                        style={[
                          styles.roleLabel,
                          selected && (isEmp ? styles.roleLabelEmployerSelected : styles.roleLabelSelected),
                        ]}
                      >
                        {t(labelKey)}
                      </Text>
                      <Text style={styles.roleDesc}>{t(descKey)}</Text>
                    </View>
                    {selected && (
                      <View style={[styles.roleCheck, isEmp && styles.roleCheckEmployer]}>
                        <Feather name="check" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={[styles.nextBtn, !userType && styles.nextBtnDisabled]}
              onPress={nextStep}
              disabled={!userType}
            >
              <Text style={[styles.nextBtnText, !userType && styles.nextBtnTextDisabled]}>
                {t("onboardingNext")}
              </Text>
              <Feather name="arrow-right" size={18} color={!userType ? colors.mutedText : "#FFFFFF"} />
            </Pressable>
          </>
        )}

        {/* ── STEP 2: Details ─────────────────────────────────────── */}
        {step === 2 && (
          <>
            <View style={styles.header}>
              <Text style={styles.emoji}>{isEmployer ? "🏢" : "📋"}</Text>
              <Text style={styles.headerTitle}>{t("onboardingStep2Title")}</Text>
              <Text style={styles.headerSubtitle}>{t("onboardingStep2Subtitle")}</Text>
            </View>

            {isStudent && (
              <>
                <View style={styles.section}>
                  <View style={styles.inputLabelRow}>
                    <Text style={styles.inputLabel}>{t("universityLabel")}</Text>
                    <Text style={styles.optionalTag}>{t("optional")}</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={university}
                    onChangeText={setUniversity}
                    placeholder={t("universityPlaceholder")}
                    placeholderTextColor={colors.mutedText}
                  />
                </View>

                <View style={styles.section}>
                  <View style={styles.inputLabelRow}>
                    <Text style={styles.inputLabel}>{t("studyYearLabel")}</Text>
                    <Text style={styles.optionalTag}>{t("optional")}</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={studyYear}
                    onChangeText={setStudyYear}
                    placeholder={t("studyYearPlaceholder")}
                    placeholderTextColor={colors.mutedText}
                    keyboardType="numeric"
                    maxLength={1}
                  />
                </View>

                <View style={styles.section}>
                  <View style={styles.inputLabelRow}>
                    <Text style={styles.inputLabel}>{t("topSkillsLabel")}</Text>
                    <Text style={styles.optionalTag}>{t("optional")}</Text>
                  </View>
                  <Text style={styles.skillsHint}>{t("topSkillsHint")}</Text>
                  <View style={styles.skillsRow}>
                    {STUDENT_SKILLS.map((skill) => {
                      const active = selectedSkills.includes(skill);
                      return (
                        <Pressable
                          key={skill}
                          style={[styles.skillChip, active && styles.skillChipActive]}
                          onPress={() => toggleSkill(skill)}
                        >
                          <Text style={[styles.skillChipText, active && styles.skillChipTextActive]}>
                            {skill}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </>
            )}

            {isEmployer && (
              <>
                <View style={styles.section}>
                  <View style={styles.inputLabelRow}>
                    <Text style={styles.inputLabel}>{t("companyName")}</Text>
                    <Text style={styles.optionalTag}>{t("optional")}</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={companyName}
                    onChangeText={setCompanyName}
                    placeholder={t("companyNamePlaceholder")}
                    placeholderTextColor={colors.mutedText}
                  />
                </View>

                <View style={styles.section}>
                  <View style={styles.inputLabelRow}>
                    <Text style={styles.inputLabel}>{t("lookingFor")}</Text>
                    <Text style={styles.optionalTag}>{t("optional")}</Text>
                  </View>
                  <TextInput
                    style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
                    value={lookingFor}
                    onChangeText={setLookingFor}
                    placeholder={t("lookingForPlaceholder")}
                    placeholderTextColor={colors.mutedText}
                    multiline
                  />
                </View>
              </>
            )}

            <Pressable style={styles.nextBtn} onPress={nextStep}>
              <Text style={styles.nextBtnText}>{t("onboardingNext")}</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </Pressable>
          </>
        )}

        {/* ── STEP 3: Name + Terms + Finish ───────────────────────── */}
        {step === 3 && (
          <>
            <View style={styles.header}>
              <Text style={styles.emoji}>✅</Text>
              <Text style={styles.headerTitle}>{t("onboardingStep3Title")}</Text>
              <Text style={styles.headerSubtitle}>{t("onboardingStep3Subtitle")}</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>{t("yourName")}</Text>
                <Text style={styles.optionalTag}>{t("optional")}</Text>
              </View>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t("yourNamePlaceholder")}
                placeholderTextColor={colors.mutedText}
                autoCapitalize="words"
              />
            </View>

            <Pressable
              style={styles.termsRow}
              onPress={() => setTermsAccepted((v) => !v)}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>{t("acceptTerms")}</Text>
            </Pressable>

            <Pressable
              style={[styles.nextBtn, (!termsAccepted || loading) && styles.nextBtnDisabled]}
              onPress={handleFinish}
              disabled={!termsAccepted || loading}
            >
              <Text
                style={[
                  styles.nextBtnText,
                  (!termsAccepted || loading) && styles.nextBtnTextDisabled,
                ]}
              >
                {loading ? t("saving") : t("getStarted")}
              </Text>
              {!loading && (
                <Feather
                  name="check"
                  size={18}
                  color={!termsAccepted ? colors.mutedText : "#FFFFFF"}
                />
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
