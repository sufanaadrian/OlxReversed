import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../src/context/LanguageContext";
import { supabase } from "../../src/lib/supabase";

const categories = [
  "Vehicles",
  "Real Estate",
  "Services",
  "Electronics & Tech",
  "Fashion & Personal",
  "Other",
] as const;

const categoryTranslationKeys: Record<string, string> = {
  Vehicles: "vehicles",
  "Real Estate": "realEstate",
  Services: "services",
  "Electronics & Tech": "electronics",
  "Fashion & Personal": "fashion",
  Other: "other",
};

type RequestType = "product" | "service";

export default function CreateRequestModal() {
  const t = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState<(typeof categories)[number]>("Services");
  const [type, setType] = useState<RequestType>("service");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    const min = Number(budgetMin);
    const max = Number(budgetMax);
    if (!title.trim()) return false;
    if (!description.trim()) return false;
    if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
    if (min <= 0 || max <= 0) return false;
    if (min > max) return false;
    return true;
  }, [title, description, budgetMin, budgetMax]);

  const submit = async () => {
    // Must be logged in to create
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;

    if (!user) {
      router.push({
        pathname: "/sign-in",
        params: { redirect: "/create-request" },
      } as any);
      return;
    }

    setLoading(true);
    try {
      const min = Number(budgetMin);
      const max = Number(budgetMax);

      const { error } = await supabase.from("requests").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        budget_min: min,
        budget_max: max,
        type,
        status: "active",
        location: location.trim() ? location.trim() : null,
      });

      if (error) throw new Error(error.message);

      router.back(); // close modal and return to previous screen
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
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>{t("cancel")}</Text>
          </Pressable>

          <Text style={styles.headerTitle}>{t("postARequest")}</Text>

          <Pressable
            onPress={submit}
            disabled={!canSubmit || loading}
            style={[
              styles.headerBtnPrimary,
              (!canSubmit || loading) && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.headerBtnPrimaryText}>
              {loading ? t("posting") : t("post")}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text style={styles.label}>{t("requestTitle")}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("exampleRequestTitle")}
            placeholderTextColor={theme.secondaryText}
            style={styles.input}
          />

          {/* Description */}
          <Text style={styles.label}>{t("description")}</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t("descriptionPlaceholder")}
            placeholderTextColor={theme.secondaryText}
            style={[styles.input, styles.textarea]}
            multiline
          />

          {/* Type */}
          <Text style={styles.label}>{t("type")}</Text>
          <View style={styles.segment}>
            <Pressable
              onPress={() => setType("product")}
              style={[
                styles.segmentItem,
                type === "product" && styles.segmentItemActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  type === "product" && styles.segmentTextActive,
                ]}
              >
                {t("product")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setType("service")}
              style={[
                styles.segmentItem,
                type === "service" && styles.segmentItemActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  type === "service" && styles.segmentTextActive,
                ]}
              >
                {t("service")}
              </Text>
            </Pressable>
          </View>

          {/* Category */}
          <Text style={styles.label}>{t("category")}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {categories.map((c) => {
              const selected = c === category;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {t(categoryTranslationKeys[c] || "other")}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Budget */}
          <Text style={styles.label}>{t("budgetRange")}</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <TextInput
                value={budgetMin}
                onChangeText={setBudgetMin}
                placeholder={t("min")}
                placeholderTextColor={theme.secondaryText}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
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

          {/* Location */}
          <Text style={styles.label}>{t("locationOptional")}</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder={t("exampleLocation")}
            placeholderTextColor={theme.secondaryText}
            style={styles.input}
          />

          {/* Submit button (big) */}
          <Pressable
            onPress={submit}
            disabled={!canSubmit || loading}
            style={[
              styles.primaryBtn,
              (!canSubmit || loading) && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? "Posting..." : "Post Request"}
            </Text>
          </Pressable>

          <Text style={styles.helper}>
            You must be logged in to post. Marketplace browsing still works
            without login.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const theme = {
  primary: "#1E40AF",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
  accentSoft: "#DBEAFE",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },

  header: {
    height: 54,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  headerTitle: { fontSize: 16, fontWeight: "900", color: theme.primaryText },
  headerBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 },
  headerBtnText: { color: theme.secondaryText, fontWeight: "800" },

  headerBtnPrimary: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.primary,
  },
  headerBtnPrimaryText: { color: "white", fontWeight: "900" },

  content: { padding: 16, paddingBottom: 28 },

  label: {
    marginTop: 14,
    marginBottom: 8,
    color: theme.primaryText,
    fontWeight: "800",
  },

  input: {
    height: 46,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    color: theme.primaryText,
  },
  textarea: { height: 110, paddingTop: 12, textAlignVertical: "top" },

  row: { flexDirection: "row", alignItems: "center" },

  segment: {
    flexDirection: "row",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    overflow: "hidden",
  },
  segmentItem: { flex: 1, paddingVertical: 12, alignItems: "center" },
  segmentItemActive: { backgroundColor: theme.accentSoft },
  segmentText: { color: theme.secondaryText, fontWeight: "800" },
  segmentTextActive: { color: theme.primaryText },

  chipsRow: { gap: 8, paddingRight: 12 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipSelected: {
    backgroundColor: theme.accentSoft,
    borderColor: theme.primary,
  },
  chipText: { color: theme.secondaryText, fontWeight: "700" },
  chipTextSelected: { color: theme.primaryText, fontWeight: "900" },

  primaryBtn: {
    marginTop: 18,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "white", fontWeight: "900" },

  helper: {
    marginTop: 10,
    color: theme.secondaryText,
    fontSize: 12,
    lineHeight: 16,
  },
});
