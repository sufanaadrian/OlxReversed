import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useTheme } from "../../src/context/ThemeContext";
import { requireAuth } from "../../src/lib/authGuard";
import { supabase } from "../../src/lib/supabase";
import { makeStyles } from "./create-offer.styles";

export default function ApplyModal() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useTranslation();
  const { requestId, title, postingAs } = useLocalSearchParams<{
    requestId: string;
    title?: string;
    postingAs?: string;
  }>();
  const isStudentPost = postingAs === "student";
  const [coverLetter, setCoverLetter] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [screeningNote, setScreeningNote] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [savedTemplate, setSavedTemplate] = useState<string | null>(null);

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
    if (requestId) {
      supabase
        .from("requests")
        .select("screening_note, category")
        .eq("id", requestId)
        .single()
        .then(({ data }) => {
          setScreeningNote(data?.screening_note ?? null);
          const cat = data?.category ?? null;
          setCategory(cat);
          if (cat) {
            AsyncStorage.getItem(`cover_tpl_${cat}`).then((tpl) => {
              if (tpl) setSavedTemplate(tpl);
            });
          }
        });
    }
  }, [checkExisting, requestId]);

  async function submitOffer(letter: string) {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/sign-in");
      return;
    }
    const parsedPrice = price.trim() ? Number(price.trim()) : null;
    const { error } = await supabase.from("offers").insert({
      request_id: requestId,
      seller_id: user.id,
      price: parsedPrice,
      cover_letter: letter || null,
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

  async function handleApply() {
    if (screeningNote && !coverLetter.trim()) {
      Alert.alert(t("error"), t("coverLetterRequired"));
      return;
    }
    await submitOffer(coverLetter.trim());
  }

  async function handleQuickApply() {
    await submitOffer("");
  }

  async function saveTemplate() {
    if (!coverLetter.trim() || !category) return;
    await AsyncStorage.setItem(`cover_tpl_${category}`, coverLetter.trim());
    setSavedTemplate(coverLetter.trim());
    Alert.alert(t("templateSaved"));
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
          <Text style={styles.headerTitle}>
            {isStudentPost ? t("contactStudent") : t("applyForJob")}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        {title ? (
          <View style={styles.jobTitleBox}>
            <Text style={styles.jobTitleLabel}>
              {isStudentPost ? t("contactingAbout") : t("applyingFor")}
            </Text>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {title}
            </Text>
          </View>
        ) : null}

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          {alreadyApplied ? (
            <View style={styles.alreadyApplied}>
              <Feather name="check-circle" size={20} color={colors.primary} />
              <Text style={styles.alreadyAppliedText}>
                {isStudentPost ? t("alreadyContacted") : t("alreadyApplied")}
              </Text>
            </View>
          ) : isStudentPost ? (
            /* ── Employer contacts a student ── */
            <>
              <Text style={styles.label}>{t("introMessageLabel")}</Text>
              <TextInput
                style={styles.coverInput}
                value={coverLetter}
                onChangeText={setCoverLetter}
                placeholder={t("introMessagePlaceholder")}
                placeholderTextColor={colors.mutedText}
                multiline
                numberOfLines={5}
                maxLength={400}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{coverLetter.length}/400</Text>

              <Text style={[styles.label, { marginTop: 16 }]}>
                {t("yourBudgetOffer")}
              </Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={styles.priceInput}
                  value={price}
                  onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
                  placeholder={t("proposedRatePlaceholder")}
                  placeholderTextColor={colors.mutedText}
                  keyboardType="decimal-pad"
                />
                <View style={styles.priceUnit}>
                  <Text style={styles.priceUnitText}>{t("rateUnit")}</Text>
                </View>
              </View>

              <Pressable
                style={[styles.submitBtn, saving && { opacity: 0.6 }]}
                onPress={handleApply}
                disabled={saving}
              >
                <Text style={styles.submitBtnText}>
                  {saving ? t("sending") : t("sendContactRequest")}
                </Text>
              </Pressable>
            </>
          ) : (
            /* ── Student applies to employer job ── */
            <>
              {/* Quick Apply — no cover letter needed when no screening note */}
              {!screeningNote && (
                <>
                  <Pressable
                    style={[styles.quickApplyBtn, saving && { opacity: 0.6 }]}
                    onPress={handleQuickApply}
                    disabled={saving}
                  >
                    <Feather name="zap" size={16} color="#FFFFFF" />
                    <Text style={styles.quickApplyBtnText}>
                      {t("quickApply")}
                    </Text>
                  </Pressable>
                  <Text style={styles.quickApplyHint}>
                    {t("quickApplyHint")}
                  </Text>
                  <View style={styles.orDivider}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>or</Text>
                    <View style={styles.orLine} />
                  </View>
                </>
              )}

              {/* Quick-fill templates */}
              <Text style={styles.label}>{t("quickFill")}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.templatesRow}
                contentContainerStyle={styles.templatesContent}
              >
                {savedTemplate && (
                  <Pressable
                    style={[styles.templateChip, styles.templateChipSaved]}
                    onPress={() => setCoverLetter(savedTemplate)}
                  >
                    <Feather name="bookmark" size={11} color={colors.primary} />
                    <Text
                      style={[
                        styles.templateChipText,
                        { color: colors.primary },
                      ]}
                      numberOfLines={1}
                    >
                      {t("useTemplate")}
                    </Text>
                  </Pressable>
                )}
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

              {/* Cover letter */}
              <Text style={styles.label}>
                {screeningNote
                  ? `${t("coverLetter")} *`
                  : t("coverLetterOptional")}
              </Text>
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
              <View style={styles.coverLetterFooter}>
                <Text style={styles.charCount}>{coverLetter.length}/600</Text>
                {coverLetter.trim().length > 20 && category && (
                  <Pressable style={styles.saveTplBtn} onPress={saveTemplate}>
                    <Feather name="bookmark" size={12} color={colors.primary} />
                    <Text style={styles.saveTplBtnText}>
                      {t("saveAsTemplate")}
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Proposed rate */}
              <Text style={styles.label}>{t("proposedRate")}</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={styles.priceInput}
                  value={price}
                  onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
                  placeholder={t("proposedRatePlaceholder")}
                  placeholderTextColor={colors.mutedText}
                  keyboardType="decimal-pad"
                />
                <View style={styles.priceUnit}>
                  <Text style={styles.priceUnitText}>{t("rateUnit")}</Text>
                </View>
              </View>

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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
