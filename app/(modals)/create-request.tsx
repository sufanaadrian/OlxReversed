import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
import { styles, theme } from "./create-request.styles";

const CATEGORIES = [
  "Hospitality",
  "Retail",
  "Tutoring",
  "Events",
  "Delivery",
  "IT",
  "Office",
  "Marketing",
  "Other",
] as const;

const CATEGORY_KEYS: Record<string, string> = {
  Hospitality: "hospitality",
  Retail: "retail",
  Tutoring: "tutoring",
  Events: "events",
  Delivery: "delivery",
  IT: "it",
  Office: "office",
  Marketing: "marketing",
  Other: "other",
};

type PostingAs = "employer" | "student";

export default function CreateJobScreen() {
  const t = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Other");
  const [location, setLocation] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [postingAs, setPostingAs] = useState<PostingAs>("employer");
  const [isUrgent, setIsUrgent] = useState(false);
  const [screeningNote, setScreeningNote] = useState("");
  const [workersNeeded, setWorkersNeeded] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    requireAuth();
    if (isEdit && params.id) {
      loadExisting(params.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadExisting(id: string) {
    const { data } = await supabase
      .from("requests")
      .select(
        "title, description, category, location, budget_min, budget_max, posting_as, is_urgent, screening_note, workers_needed",
      )
      .eq("id", id)
      .single();
    if (!data) return;
    setTitle(data.title ?? "");
    setDescription(data.description ?? "");
    setCategory(data.category ?? "Other");
    setLocation(data.location ?? "");
    setBudgetMin(data.budget_min != null ? String(data.budget_min) : "");
    setBudgetMax(data.budget_max != null ? String(data.budget_max) : "");
    setPostingAs((data.posting_as as PostingAs) ?? "employer");
    setIsUrgent(data.is_urgent ?? false);
    setScreeningNote(data.screening_note ?? "");
    setWorkersNeeded(data.workers_needed ?? 1);
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert(t("error"), t("titleRequired"));
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

    const payload = {
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      category,
      location: location.trim() || null,
      budget_min: budgetMin ? Number(budgetMin) : null,
      budget_max: budgetMax ? Number(budgetMax) : null,
      posting_as: postingAs,
      is_urgent: isUrgent,
      screening_note: screeningNote.trim() || null,
      workers_needed: postingAs === "employer" ? workersNeeded : 1,
      status: "active",
    };

    if (isEdit && params.id) {
      const { error } = await supabase
        .from("requests")
        .update(payload)
        .eq("id", params.id);
      if (error) Alert.alert(t("error"), error.message);
      else router.back();
    } else {
      const { error } = await supabase.from("requests").insert(payload);
      if (error) Alert.alert(t("error"), error.message);
      else router.back();
    }
    setSaving(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="x" size={22} color={theme.primaryText} />
            </Pressable>
            <Text style={styles.headerTitle}>
              {isEdit ? t("editPost") : t("createPost")}
            </Text>
            <View style={{ width: 38 }} />
          </View>

          {/* Posting as toggle */}
          <View style={styles.section}>
            <Text style={styles.label}>{t("iAm")}</Text>
            <View style={styles.toggleRow}>
              {(["employer", "student"] as PostingAs[]).map((role) => (
                <Pressable
                  key={role}
                  style={[
                    styles.toggleBtn,
                    postingAs === role && styles.toggleBtnActive,
                    postingAs === role && {
                      backgroundColor:
                        role === "employer"
                          ? theme.employerLight
                          : theme.primaryLight,
                      borderColor:
                        role === "employer" ? theme.employer : theme.primary,
                    },
                  ]}
                  onPress={() => setPostingAs(role)}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      postingAs === role && {
                        color:
                          role === "employer" ? theme.employer : theme.primary,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {t(role)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>{t("jobTitle")} *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={
                postingAs === "employer"
                  ? t("jobTitlePlaceholderEmployer")
                  : t("jobTitlePlaceholderStudent")
              }
              placeholderTextColor={theme.mutedText}
              maxLength={120}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>{t("description")}</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder={t("descriptionPlaceholder")}
              placeholderTextColor={theme.mutedText}
              multiline
              numberOfLines={4}
              maxLength={800}
            />
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.label}>{t("category")}</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.catChip,
                    category === cat && styles.catChipSelected,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      category === cat && styles.catChipTextSelected,
                    ]}
                  >
                    {t(CATEGORY_KEYS[cat] ?? "other")}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.label}>{t("location")}</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder={t("locationPlaceholder")}
              placeholderTextColor={theme.mutedText}
            />
          </View>

          {/* Wage / Budget */}
          <View style={styles.section}>
            <Text style={styles.label}>{t("wageRange")}</Text>
            <View style={styles.rangeRow}>
              <TextInput
                style={[styles.input, styles.rangeInput]}
                value={budgetMin}
                onChangeText={setBudgetMin}
                placeholder={t("minRon")}
                placeholderTextColor={theme.mutedText}
                keyboardType="numeric"
              />
              <Text style={styles.rangeSep}>–</Text>
              <TextInput
                style={[styles.input, styles.rangeInput]}
                value={budgetMax}
                onChangeText={setBudgetMax}
                placeholder={t("maxRon")}
                placeholderTextColor={theme.mutedText}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Screening note */}
          <View style={styles.section}>
            <Text style={styles.label}>{t("screeningNote")}</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={screeningNote}
              onChangeText={setScreeningNote}
              placeholder={t("screeningNotePlaceholder")}
              placeholderTextColor={theme.mutedText}
              multiline
              numberOfLines={3}
              maxLength={400}
            />
          </View>

          {/* Workers needed (employer only) */}
          {postingAs === "employer" && (
            <View style={styles.section}>
              <Text style={styles.label}>{t("workersNeeded")}</Text>
              <Text style={styles.hint}>{t("workersNeededHint")}</Text>
              <View style={styles.stepperRow}>
                <Pressable
                  style={[
                    styles.stepperBtn,
                    workersNeeded <= 1 && styles.stepperBtnDisabled,
                  ]}
                  onPress={() => setWorkersNeeded((v) => Math.max(1, v - 1))}
                  disabled={workersNeeded <= 1}
                >
                  <Feather
                    name="minus"
                    size={18}
                    color={workersNeeded <= 1 ? theme.mutedText : theme.primary}
                  />
                </Pressable>
                <Text style={styles.stepperValue}>{workersNeeded}</Text>
                <Pressable
                  style={[
                    styles.stepperBtn,
                    workersNeeded >= 20 && styles.stepperBtnDisabled,
                  ]}
                  onPress={() => setWorkersNeeded((v) => Math.min(20, v + 1))}
                  disabled={workersNeeded >= 20}
                >
                  <Feather
                    name="plus"
                    size={18}
                    color={
                      workersNeeded >= 20 ? theme.mutedText : theme.primary
                    }
                  />
                </Pressable>
              </View>
            </View>
          )}

          {/* Urgently hiring toggle */}
          <View style={styles.section}>
            <Pressable
              style={styles.urgentRow}
              onPress={() => setIsUrgent((v) => !v)}
            >
              <View
                style={[
                  styles.urgentCheckbox,
                  isUrgent && styles.urgentCheckboxActive,
                ]}
              >
                {isUrgent && <Feather name="check" size={14} color="#FFFFFF" />}
              </View>
              <View>
                <Text style={styles.urgentLabel}>{t("isUrgent")}</Text>
                <Text style={styles.urgentHint}>
                  Shows a 🔥 badge on your post
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Submit */}
          <Pressable
            style={[styles.submitBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.submitBtnText}>
              {saving ? t("saving") : isEdit ? t("saveChanges") : t("postJob")}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
