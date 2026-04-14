import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
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

const categories = [
  "Services",
  "Vehicles",
  "Real Estate",
  "Electronics & Tech",
  "Fashion & Personal",
  "Other",
] as const;

const categoryTranslationKeys: Record<string, string> = {
  Services: "services",
  Vehicles: "vehicles",
  "Real Estate": "realEstate",
  "Electronics & Tech": "electronics",
  "Fashion & Personal": "fashion",
  Other: "other",
};

type Duration = "few_hours" | "full_day" | "multi_day" | "recurring";
type WorkMode = "onsite" | "remote" | "hybrid";
type Experience = "any" | "beginner" | "experienced" | "expert";
type Equipment = "not_needed" | "pro_provides" | "client_provides";
type Schedule = "anytime" | "weekdays" | "weekends" | "specific_date";
type PostingMode = "seeking" | "offering";
type BudgetType = "range" | "per_hour" | "per_day" | "fixed";

const MAX_PHOTOS = 5;

export default function CreateRequestModal() {
  const t = useTranslation();
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const isEditMode = !!requestId;

  // ── Posting mode ──────────────────────────────────────────────────
  const [postingAs, setPostingAs] = useState<PostingMode>("seeking");
  const isOffering = postingAs === "offering";

  // ── Core ─────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState<(typeof categories)[number]>("Services");
  const [budgetType, setBudgetType] = useState<BudgetType>("range");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [openBudget, setOpenBudget] = useState(false);
  const [location, setLocation] = useState("");

  // ── Job Specifics ────────────────────────────────────────────────
  const [scheduledDate, setScheduledDate] = useState("");
  const [duration, setDuration] = useState<Duration>("few_hours");
  const [workers, setWorkers] = useState(1);

  // ── Context ──────────────────────────────────────────────────────
  const [workMode, setWorkMode] = useState<WorkMode>("onsite");
  const [experience, setExperience] = useState<Experience>("any");
  const [equipment, setEquipment] = useState<Equipment>("not_needed");
  const [preferredSchedule, setPreferredSchedule] =
    useState<Schedule>("anytime");
  const [specialRequirements, setSpecialRequirements] = useState("");

  // ── Photos ───────────────────────────────────────────────────────
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Populate from DB in edit mode ────────────────────────────────
  useEffect(() => {
    if (!requestId) return;
    (async () => {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();
      if (error || !data) {
        Alert.alert(t("error"), error?.message ?? t("requestNotFound"));
        router.back();
        return;
      }
      setPostingAs((data.posting_as as PostingMode) ?? "seeking");
      setTitle(data.title ?? "");
      setDescription(data.description ?? "");
      setCategory((data.category as (typeof categories)[number]) ?? "Services");
      setOpenBudget(data.open_budget ?? false);
      const type = (data.budget_type as BudgetType) ?? "range";
      setBudgetType(type);
      if (type === "range") {
        setBudgetMin(data.budget_min != null ? String(data.budget_min) : "");
        setBudgetMax(data.budget_max != null ? String(data.budget_max) : "");
      } else {
        setBudgetAmount(data.budget_min != null ? String(data.budget_min) : "");
      }
      setLocation(data.location ?? "");
      setDuration((data.duration as Duration) ?? "few_hours");
      setWorkers(data.workers_needed ?? 1);
      setWorkMode((data.work_mode as WorkMode) ?? "onsite");
      setExperience((data.experience_level as Experience) ?? "any");
      setEquipment((data.equipment as Equipment) ?? "not_needed");
      setPreferredSchedule((data.preferred_schedule as Schedule) ?? "anytime");
      setScheduledDate(data.scheduled_date ?? "");
      setSpecialRequirements(data.special_requirements ?? "");
      setPhotos(data.photos ?? []);
    })();
  }, [requestId, t]);

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    if (!description.trim()) return false;
    if (!openBudget) {
      if (budgetType === "range") {
        const min = Number(budgetMin);
        const max = Number(budgetMax);
        if (!budgetMin || !budgetMax) return false;
        if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
        if (min <= 0 || max <= 0 || min > max) return false;
      } else {
        const amt = Number(budgetAmount);
        if (!budgetAmount) return false;
        if (!Number.isFinite(amt) || amt <= 0) return false;
      }
    }
    return true;
  }, [
    title,
    description,
    budgetType,
    budgetMin,
    budgetMax,
    budgetAmount,
    openBudget,
  ]);

  const addPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("photosPermission"), t("allowPhotosAccess"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.85,
      allowsMultipleSelection: false,
    });
    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;
    setPhotos((prev) => [...prev, uri]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhoto = async (uri: string): Promise<string> => {
    const extMatch = uri.match(/\.(\w+)(\?|$)/);
    const ext = extMatch?.[1]?.toLowerCase() ?? "jpg";
    const mime = `image/${ext === "jpg" ? "jpeg" : ext}`;
    const fileName = `job-photos/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

    let readUri = uri;
    if (!uri.startsWith("file://")) {
      const dest = `${FileSystem.cacheDirectory}upload-${Date.now()}.${ext}`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      readUri = dest;
    }

    const base64 = await FileSystem.readAsStringAsync(readUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const binary = globalThis.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const { data, error } = await supabase.storage
      .from("job-photos")
      .upload(fileName, bytes, { contentType: mime, upsert: false });
    if (error) throw error;

    const { data: pub } = supabase.storage
      .from("job-photos")
      .getPublicUrl(data.path);
    return pub.publicUrl;
  };

  const submit = async () => {
    setLoading(true);
    try {
      const photoUrls: string[] = await Promise.all(
        photos.map((uri) =>
          uri.startsWith("https://") ? Promise.resolve(uri) : uploadPhoto(uri),
        ),
      );

      let bMin: number | null = null;
      let bMax: number | null = null;
      if (!openBudget) {
        if (budgetType === "range") {
          bMin = Number(budgetMin);
          bMax = Number(budgetMax);
        } else {
          const amt = Number(budgetAmount);
          bMin = amt;
          bMax = amt;
        }
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        budget_min: bMin,
        budget_max: bMax,
        open_budget: openBudget,
        location: location.trim() || null,
        posting_as: postingAs,
        budget_type: openBudget ? null : budgetType,
        timeline: null,
        scheduled_date:
          preferredSchedule === "specific_date"
            ? scheduledDate.trim() || null
            : null,
        duration: isOffering ? duration : null,
        workers_needed: isOffering ? workers : null,
        work_mode: workMode,
        experience_level: experience,
        equipment,
        preferred_schedule: preferredSchedule,
        special_requirements: specialRequirements.trim() || null,
        photos: photoUrls,
      };

      let error;
      if (isEditMode) {
        ({ error } = await supabase
          .from("requests")
          .update(payload)
          .eq("id", requestId));
      } else {
        const guard = await requireAuth("/create-request");
        if (!guard.ok) return;
        ({ error } = await supabase.from("requests").insert({
          ...payload,
          user_id: guard.userId,
          type: "service",
          status: "active",
        }));
      }

      if (error) throw error;
      router.back();
    } catch (e: any) {
      Alert.alert(t("couldNotPostRequest"), e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>{t("cancel")}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {isEditMode ? t("editRequest") : t("postARequest")}
          </Text>
          <Pressable
            onPress={submit}
            disabled={!canSubmit || loading}
            style={[
              styles.headerBtnPrimary,
              (!canSubmit || loading) && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.headerBtnPrimaryText}>
              {loading
                ? isEditMode
                  ? t("saving")
                  : t("posting")
                : isEditMode
                  ? t("saveChanges")
                  : t("post")}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Posting Mode ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("postingAs")}</Text>
            <View style={styles.modeRow}>
              <Pressable
                style={[
                  styles.modeCard,
                  postingAs === "seeking" && styles.modeCardActive,
                ]}
                onPress={() => {
                  setPostingAs("seeking");
                  setBudgetType("range");
                }}
              >
                <Text style={styles.modeIcon}>🔍</Text>
                <Text style={styles.modeTitle}>{t("postingSeeking")}</Text>
                <Text style={styles.modeDesc}>{t("postingSeekingDesc")}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modeCard,
                  postingAs === "offering" && styles.modeCardActive,
                ]}
                onPress={() => setPostingAs("offering")}
              >
                <Text style={styles.modeIcon}>🛠️</Text>
                <Text style={styles.modeTitle}>{t("postingOffering")}</Text>
                <Text style={styles.modeDesc}>{t("postingOfferingDesc")}</Text>
              </Pressable>
            </View>
          </View>

          {/* ── Section 1: Core Details ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("jobSectionCore")}</Text>

            <Text style={[styles.label, styles.labelFirst]}>
              {isOffering ? t("offeringTitle") : t("requestTitle")}
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={
                isOffering
                  ? t("offeringTitlePlaceholder")
                  : t("exampleRequestTitle")
              }
              placeholderTextColor={theme.secondaryText}
              style={styles.input}
            />

            <Text style={styles.label}>{t("description")}</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={
                isOffering
                  ? t("offeringDescPlaceholder")
                  : t("descriptionPlaceholder")
              }
              placeholderTextColor={theme.secondaryText}
              style={[styles.input, styles.textarea]}
              multiline
            />

            <Text style={styles.label}>{t("category")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {categories.map((c) => {
                const active = c === category;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {t(categoryTranslationKeys[c] || "other")}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={styles.label}>
              {isOffering ? t("offeringBudgetType") : t("budgetType")}
            </Text>

            {isOffering && (
              <>
                <View style={styles.chipsWrap}>
                  {(
                    ["range", "per_hour", "per_day", "fixed"] as BudgetType[]
                  ).map((v) => (
                    <Pressable
                      key={v}
                      style={[
                        styles.chip,
                        !openBudget && budgetType === v && styles.chipActive,
                        openBudget && { opacity: 0.4 },
                      ]}
                      onPress={() => {
                        if (!openBudget) setBudgetType(v);
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          !openBudget &&
                            budgetType === v &&
                            styles.chipTextActive,
                        ]}
                      >
                        {v === "range"
                          ? t("budgetTypeRange")
                          : v === "per_hour"
                            ? t("budgetPerHour")
                            : v === "per_day"
                              ? t("budgetPerDay")
                              : t("budgetFixed")}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {!openBudget && budgetType === "range" && (
              <View style={[styles.budgetRow, { marginTop: 10 }]}>
                <View style={styles.budgetInput}>
                  <TextInput
                    value={budgetMin}
                    onChangeText={setBudgetMin}
                    placeholder={t("min")}
                    placeholderTextColor={theme.secondaryText}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </View>
                <View style={styles.budgetInput}>
                  <TextInput
                    value={budgetMax}
                    onChangeText={setBudgetMax}
                    placeholder={t("max")}
                    placeholderTextColor={theme.secondaryText}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </View>
              </View>
            )}

            {!openBudget && budgetType !== "range" && (
              <TextInput
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                placeholder={t("budgetAmount")}
                placeholderTextColor={theme.secondaryText}
                keyboardType="number-pad"
                style={[styles.input, { marginTop: 10 }]}
              />
            )}

            <Pressable
              style={styles.openBudgetPressable}
              onPress={() => setOpenBudget((v) => !v)}
            >
              <View
                style={[
                  styles.openBudgetCheckbox,
                  openBudget && styles.openBudgetCheckboxActive,
                ]}
              >
                {openBudget && (
                  <Text
                    style={{ color: "white", fontSize: 12, fontWeight: "900" }}
                  >
                    ✓
                  </Text>
                )}
              </View>
              <Text style={styles.openBudgetLabel}>
                {isOffering ? t("offeringOpenBudget") : t("openBudget")}
              </Text>
            </Pressable>

            <Text style={styles.label}>{t("locationOptional")}</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder={t("exampleLocation")}
              placeholderTextColor={theme.secondaryText}
              style={styles.input}
            />
          </View>

          {/* ── Section 2: Job Specifics (offering mode only) ── */}
          {isOffering && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t("jobSectionSpecifics")}
              </Text>

              <Text style={[styles.label, styles.labelFirst]}>
                {t("offeringDuration")}
              </Text>
              <View style={styles.chipsWrap}>
                {(
                  [
                    "few_hours",
                    "full_day",
                    "multi_day",
                    "recurring",
                  ] as Duration[]
                ).map((v) => (
                  <Pressable
                    key={v}
                    style={[styles.chip, duration === v && styles.chipActive]}
                    onPress={() => setDuration(v)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        duration === v && styles.chipTextActive,
                      ]}
                    >
                      {v === "few_hours"
                        ? t("durationHours")
                        : v === "full_day"
                          ? t("durationDay")
                          : v === "multi_day"
                            ? t("durationMultiDay")
                            : t("durationRecurring")}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>{t("workersNeeded")}</Text>
              <View style={styles.stepperRow}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => setWorkers((v) => Math.max(1, v - 1))}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{workers}</Text>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => setWorkers((v) => Math.min(20, v + 1))}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ── Section 3: Context ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("jobSectionContext")}</Text>

            <Text style={[styles.label, styles.labelFirst]}>
              {t("workMode")}
            </Text>
            <View style={styles.chipsWrap}>
              {(["onsite", "remote", "hybrid"] as WorkMode[]).map((v) => (
                <Pressable
                  key={v}
                  style={[styles.chip, workMode === v && styles.chipActive]}
                  onPress={() => setWorkMode(v)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      workMode === v && styles.chipTextActive,
                    ]}
                  >
                    {v === "onsite"
                      ? t("workOnsite")
                      : v === "remote"
                        ? t("workRemote")
                        : t("workHybrid")}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>
              {isOffering ? t("offeringExperience") : t("experienceLevel")}
            </Text>
            <View style={styles.chipsWrap}>
              {(
                ["any", "beginner", "experienced", "expert"] as Experience[]
              ).map((v) => (
                <Pressable
                  key={v}
                  style={[styles.chip, experience === v && styles.chipActive]}
                  onPress={() => setExperience(v)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      experience === v && styles.chipTextActive,
                    ]}
                  >
                    {v === "any"
                      ? t("experienceAny")
                      : v === "beginner"
                        ? t("experienceBeginner")
                        : v === "experienced"
                          ? t("experienceExperienced")
                          : t("experienceExpert")}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>{t("equipmentLabel")}</Text>
            <View style={styles.chipsWrap}>
              {(
                ["not_needed", "pro_provides", "client_provides"] as Equipment[]
              ).map((v) => (
                <Pressable
                  key={v}
                  style={[styles.chip, equipment === v && styles.chipActive]}
                  onPress={() => setEquipment(v)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      equipment === v && styles.chipTextActive,
                    ]}
                  >
                    {v === "not_needed"
                      ? t("equipmentNotNeeded")
                      : v === "pro_provides"
                        ? isOffering
                          ? t("offeringEquipmentPro")
                          : t("equipmentPro")
                        : isOffering
                          ? t("offeringEquipmentClient")
                          : t("equipmentClient")}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>
              {isOffering ? t("offeringAvailability") : t("preferredSchedule")}
            </Text>
            <View style={styles.chipsWrap}>
              {(
                [
                  "anytime",
                  "weekdays",
                  "weekends",
                  "specific_date",
                ] as Schedule[]
              ).map((v) => (
                <Pressable
                  key={v}
                  style={[
                    styles.chip,
                    preferredSchedule === v && styles.chipActive,
                  ]}
                  onPress={() => setPreferredSchedule(v)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      preferredSchedule === v && styles.chipTextActive,
                    ]}
                  >
                    {v === "anytime"
                      ? t("scheduleAnytime")
                      : v === "weekdays"
                        ? t("scheduleWeekdays")
                        : v === "weekends"
                          ? t("scheduleWeekends")
                          : t("scheduleSpecificDate")}
                  </Text>
                </Pressable>
              ))}
            </View>

            {preferredSchedule === "specific_date" && (
              <>
                <Text style={styles.label}>{t("scheduledDate")}</Text>
                <TextInput
                  value={scheduledDate}
                  onChangeText={setScheduledDate}
                  placeholder={t("scheduledDatePlaceholder")}
                  placeholderTextColor={theme.secondaryText}
                  style={styles.input}
                />
              </>
            )}

            <Text style={styles.label}>{t("specialRequirements")}</Text>
            <TextInput
              value={specialRequirements}
              onChangeText={setSpecialRequirements}
              placeholder={t("specialRequirementsPlaceholder")}
              placeholderTextColor={theme.secondaryText}
              style={[styles.input, styles.textareaSmall]}
              multiline
            />
          </View>

          {/* ── Section 4: Photos ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("jobSectionPhotos")}</Text>
            <View style={styles.photoGrid}>
              {photos.map((uri, idx) => (
                <View key={`${uri}-${idx}`} style={styles.photoThumb}>
                  <Image
                    source={{ uri }}
                    style={styles.photoImg}
                    resizeMode="cover"
                  />
                  <Pressable
                    style={styles.photoOverlay}
                    onPress={() => removePhoto(idx)}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 13,
                        fontWeight: "900",
                        lineHeight: 16,
                      }}
                    >
                      ✕
                    </Text>
                  </Pressable>
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <Pressable style={styles.addPhotoBtn} onPress={addPhoto}>
                  <Text style={{ fontSize: 24, color: theme.secondaryText }}>
                    +
                  </Text>
                  <Text style={styles.addPhotoBtnText}>{t("addPhotos")}</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.photoHint}>{t("photoHint")}</Text>
          </View>

          {/* ── Submit ── */}
          <Pressable
            onPress={submit}
            disabled={!canSubmit || loading}
            style={[
              styles.submitBtn,
              (!canSubmit || loading) && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.submitBtnText}>
              {loading
                ? isEditMode
                  ? t("saving")
                  : t("uploadingPhotos")
                : isEditMode
                  ? t("saveChanges")
                  : t("postARequest")}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
