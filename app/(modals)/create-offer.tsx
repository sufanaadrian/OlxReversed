import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState, useMemo} from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../src/context/LanguageContext";
import { requireAuth } from "../../src/lib/authGuard";
import { supabase } from "../../src/lib/supabase";
import { makeStyles } from "./create-offer.styles";
import { useTheme } from "../../src/context/ThemeContext";

export default function ApplyModal() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useTranslation();
  const { requestId, title } = useLocalSearchParams<{
    requestId: string;
    title?: string;
  }>();
  const [coverLetter, setCoverLetter] = useState("");
  const [saving, setSaving] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [screeningNote, setScreeningNote] = useState<string | null>(null);

  const checkExisting = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !requestId) return;
    const { data } = await supabase
      .from("offers")
      .select("id")
      .eq("request_id", requestId)
      .eq("seller_id", user.id)
      .neq("status", "withdrawn")
      .maybeSingle();
    setAlreadyApplied(!!data);
  }, [requestId]);

  useEffect(() => {
    requireAuth();
    checkExisting();
    // Load screening note
    if (requestId) {
      supabase
        .from("requests")
        .select("screening_note")
        .eq("id", requestId)
        .single()
        .then(({ data }) => setScreeningNote(data?.screening_note ?? null));
    }
  }, [checkExisting, requestId]);

  async function handleApply() {
    if (!coverLetter.trim()) {
      Alert.alert(t("error"), t("coverLetterRequired"));
      return;
    }
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/sign-in");
      return;
    }

    const { error } = await supabase.from("offers").insert({
      request_id: requestId,
      seller_id: user.id,
      price: null,
      cover_letter: coverLetter.trim(),
      status: "pending",
    });

    setSaving(false);
    if (error) {
      Alert.alert(t("error"), error.message);
    } else {
      Alert.alert(t("applicationSent"), t("applicationSentDesc"), [
        { text: t("ok"), onPress: () => router.back() },
      ]);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.primaryText} />
          </Pressable>
          <Text style={styles.headerTitle}>{t("applyForJob")}</Text>
          <View style={{ width: 38 }} />
        </View>

        {title ? (
          <View style={styles.jobTitleBox}>
            <Text style={styles.jobTitleLabel}>{t("applyingFor")}</Text>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {title}
            </Text>
          </View>
        ) : null}

        <View style={styles.body}>
          {alreadyApplied ? (
            <View style={styles.alreadyApplied}>
              <Feather name="check-circle" size={20} color={colors.primary} />
              <Text style={styles.alreadyAppliedText}>
                {t("alreadyApplied")}
              </Text>
            </View>
          ) : (
            <>
              {/* Quick-fill templates */}
              <Text style={styles.label}>{t("quickFill")}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.templatesRow}
                contentContainerStyle={styles.templatesContent}
              >
                {[
                  "Hi, I'm a student with relevant experience and I'm very interested in this role.",
                  "I'm available immediately, motivated, and flexible with schedule.",
                  "I have hands-on experience in this field and can start right away.",
                  "I'm a reliable, fast learner looking for part-time work that fits my studies.",
                ].map((tpl, i) => (
                  <Pressable
                    key={i}
                    style={styles.templateChip}
                    onPress={() => setCoverLetter(tpl)}
                  >
                    <Text style={styles.templateChipText} numberOfLines={1}>
                      {t(
                        [
                          `templateFriendly`,
                          `templateAvailable`,
                          `templateExperienced`,
                          `templateCustom`,
                        ][i] as any,
                      )}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Screening note from employer */}
              {screeningNote ? (
                <View style={styles.screeningBox}>
                  <Feather name="info" size={14} color="#7C3AED" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.screeningLabel}>
                      {t("noteFromEmployer")}
                    </Text>
                    <Text style={styles.screeningText}>{screeningNote}</Text>
                  </View>
                </View>
              ) : null}

              <Text style={styles.label}>{t("coverLetter")} *</Text>
              <TextInput
                style={styles.coverInput}
                value={coverLetter}
                onChangeText={setCoverLetter}
                placeholder={t("coverLetterPlaceholder")}
                placeholderTextColor={colors.mutedText}
                multiline
                numberOfLines={6}
                maxLength={600}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{coverLetter.length}/600</Text>
              <Pressable
                style={[styles.submitBtn, saving && { opacity: 0.6 }]}
                onPress={handleApply}
                disabled={saving}
              >
                <Text style={styles.submitBtnText}>
                  {saving ? t("sending") : t("sendApplication")}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
