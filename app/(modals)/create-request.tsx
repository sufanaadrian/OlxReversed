import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { JOB_TYPES } from "../../src/data/jobTypes";
import { requireAuth } from "../../src/lib/authGuard";
import { supabase } from "../../src/lib/supabase";
import { makeStyles } from "./create-request.styles";

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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
  const [jobType, setJobType] = useState("");
  const [scheduleType, setScheduleType] = useState("part-time");
  const [availabilityTags, setAvailabilityTags] = useState<string[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [screeningNote, setScreeningNote] = useState("");
  const [workersNeeded, setWorkersNeeded] = useState(1);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<
    { id: string; title: string; category: string | null }[]
  >([]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    requireAuth();
    if (isEdit && params.id) {
      loadExisting(params.id);
    }
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTemplates() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("job_templates")
      .select("id, title, category")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setTemplates(data ?? []);
  }

  async function applyTemplate(id: string) {
    const { data } = await supabase
      .from("job_templates")
      .select(
        "title, description, category, location, budget_min, budget_max, posting_as, job_type, schedule_type, availability_tags, screening_note, is_urgent, workers_needed",
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
    setJobType(data.job_type ?? "");
    setScheduleType(data.schedule_type ?? "part-time");
    setAvailabilityTags(data.availability_tags ?? []);
    setIsUrgent(data.is_urgent ?? false);
    setScreeningNote(data.screening_note ?? "");
    setWorkersNeeded(data.workers_needed ?? 1);
    setShowTemplates(false);
  }

  async function loadExisting(id: string) {
    const { data } = await supabase
      .from("requests")
      .select(
        "title, description, category, location, budget_min, budget_max, posting_as, is_urgent, screening_note, workers_needed, job_type, schedule_type, rate_type, availability_tags",
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
    setJobType(data.job_type ?? "");
    setScheduleType(data.schedule_type ?? "part-time");
    setAvailabilityTags(data.availability_tags ?? []);
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
      job_type: postingAs === "employer" ? jobType || null : null,
      schedule_type: postingAs === "employer" ? scheduleType || null : null,
      rate_type: null,
      availability_tags: availabilityTags.length ? availabilityTags : null,
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
              <Feather name="x" size={22} color={colors.primaryText} />
            </Pressable>
            <Text style={styles.headerTitle}>
              {isEdit ? t("editPost") : t("createPost")}
            </Text>
            <View style={{ width: 38 }} />
          </View>

          {/* Template bar — only in new post mode with saved templates */}
          {!isEdit && templates.length > 0 && (
            <View style={styles.templateBar}>
              <Pressable
                style={styles.templateBarHeader}
                onPress={() => setShowTemplates((v) => !v)}
              >
                <Feather name="bookmark" size={15} color={colors.primary} />
                <Text style={styles.templateBarTitle}>{t("useTemplate")}</Text>
                <Feather
                  name={showTemplates ? "chevron-up" : "chevron-down"}
                  size={15}
                  color={colors.mutedText}
                />
              </Pressable>
              {showTemplates && (
                <View style={styles.templateList}>
                  {templates.map((tpl) => (
                    <Pressable
                      key={tpl.id}
                      style={styles.templateChip}
                      onPress={() => applyTemplate(tpl.id)}
                    >
                      <Text style={styles.templateChipText}>{tpl.title}</Text>
                      {tpl.category ? (
                        <Text style={styles.templateChipCat}>
                          {tpl.category}
                        </Text>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

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
                          ? colors.employerLight
                          : colors.primaryLight,
                      borderColor:
                        role === "employer" ? colors.employer : colors.primary,
                    },
                  ]}
                  onPress={() => setPostingAs(role)}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      postingAs === role && {
                        color:
                          role === "employer"
                            ? colors.employer
                            : colors.primary,
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
              placeholderTextColor={colors.mutedText}
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
              placeholderTextColor={colors.mutedText}
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
                  onPress={() => {
                    setCategory(cat);
                    setJobType("");
                  }}
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

          {/* Job type — employer only */}
          {postingAs === "employer" &&
            (JOB_TYPES[category]?.length ?? 0) > 0 && (
              <View style={styles.section}>
                <Text style={styles.label}>{t("jobType")}</Text>
                <Text style={styles.hint}>{t("jobTypeHint")}</Text>
                <View style={styles.catGrid}>
                  {JOB_TYPES[category].map((jt) => (
                    <Pressable
                      key={jt}
                      style={[
                        styles.catChip,
                        jobType === jt && styles.catChipSelected,
                      ]}
                      onPress={() => setJobType(jobType === jt ? "" : jt)}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          jobType === jt && styles.catChipTextSelected,
                        ]}
                      >
                        {jt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.label}>{t("location")}</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder={t("locationPlaceholder")}
              placeholderTextColor={colors.mutedText}
            />
          </View>

          {/* Wage / Budget — employer only */}
          {postingAs === "employer" && (
            <View style={styles.section}>
              <Text style={styles.label}>{t("wageRange")}</Text>
              <View style={styles.rangeRow}>
                <TextInput
                  style={[styles.input, styles.rangeInput]}
                  value={budgetMin}
                  onChangeText={setBudgetMin}
                  placeholder={t("minRon")}
                  placeholderTextColor={colors.mutedText}
                  keyboardType="numeric"
                />
                <Text style={styles.rangeSep}>–</Text>
                <TextInput
                  style={[styles.input, styles.rangeInput]}
                  value={budgetMax}
                  onChangeText={setBudgetMax}
                  placeholder={t("maxRon")}
                  placeholderTextColor={colors.mutedText}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* Screening note */}
          <View style={styles.section}>
            <Text style={styles.label}>
              {postingAs === "employer"
                ? t("screeningNote")
                : t("screeningNoteStudent")}
            </Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={screeningNote}
              onChangeText={setScreeningNote}
              placeholder={
                postingAs === "employer"
                  ? t("screeningNotePlaceholder")
                  : t("screeningNotePlaceholderStudent")
              }
              placeholderTextColor={colors.mutedText}
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
                    color={
                      workersNeeded <= 1 ? colors.mutedText : colors.primary
                    }
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
                      workersNeeded >= 20 ? colors.mutedText : colors.primary
                    }
                  />
                </Pressable>
              </View>
            </View>
          )}

          {/* Schedule type — employer only */}
          {postingAs === "employer" && (
            <View style={styles.section}>
              <Text style={[styles.label, styles.labelFirst]}>
                {t("scheduleType")}
              </Text>
              <Text style={styles.hint}>{t("scheduleTypeHint")}</Text>
              <View style={styles.chipsWrap}>
                {(
                  [
                    ["part-time", t("schedulePartTime")],
                    ["full-time", t("scheduleFullTime")],
                    ["weekend", t("scheduleWeekend")],
                    ["seasonal", t("scheduleSeasonal")],
                    ["remote", t("scheduleRemote")],
                    ["flexible", t("scheduleFlexible")],
                  ] as [string, string][]
                ).map(([value, label]) => (
                  <Pressable
                    key={value}
                    style={[
                      styles.chip,
                      scheduleType === value && styles.chipActive,
                    ]}
                    onPress={() => setScheduleType(value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        scheduleType === value && styles.chipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Availability — shift slots (employer) / when free (student) */}
          <View style={styles.section}>
            <Text style={[styles.label, styles.labelFirst]}>
              {postingAs === "employer"
                ? t("shiftSlots")
                : t("availabilityTags")}
            </Text>
            <Text style={styles.hint}>
              {postingAs === "employer"
                ? t("shiftSlotsHint")
                : t("availabilityTagsHint")}
            </Text>
            <View style={styles.chipsWrap}>
              {(
                [
                  ["weekdays", t("availWeekdays")],
                  ["mornings", t("availMorn")],
                  ["afternoons", t("availAft")],
                  ["evenings", t("availEve")],
                  ["nights", t("availNights")],
                  ["friday", t("availFri")],
                  ["saturday", t("availSat")],
                  ["sunday", t("availSun")],
                  ["flexible", t("availFlexible")],
                ] as [string, string][]
              ).map(([value, label]) => {
                const active = availabilityTags.includes(value);
                return (
                  <Pressable
                    key={value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() =>
                      setAvailabilityTags((prev) =>
                        active
                          ? prev.filter((t) => t !== value)
                          : [...prev, value],
                      )
                    }
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

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
