import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../src/context/LanguageContext";
import { useTheme } from "../src/context/ThemeContext";
import { supabase } from "../src/lib/supabase";
import {
    CATEGORY_COLORS,
    CATEGORY_COLORS_DARK,
    makeStyles,
} from "./saved-jobs.styles";

type SavedJob = {
  saveId: string;
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  budget_min: number | null;
  budget_max: number | null;
  location: string | null;
  status: string;
  posting_as: string | null;
  created_at: string;
  username: string | null;
};

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

function formatWage(min: number | null, max: number | null) {
  if (!min && !max) return null;
  if (min && max) return `${min}–${max} RON/h`;
  if (min) return `${min}+ RON/h`;
  return `~${max} RON/h`;
}

export default function SavedJobsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useTranslation();
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);

  const catColors = colors.isDark ? CATEGORY_COLORS_DARK : CATEGORY_COLORS;

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("saved_jobs")
      .select(
        "id, request_id, requests(id, title, description, category, budget_min, budget_max, location, status, posting_as, created_at, profiles(username))",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const mapped: SavedJob[] = (data ?? []).map((row: any) => ({
      saveId: row.id,
      id: row.requests?.id,
      title: row.requests?.title,
      description: row.requests?.description ?? null,
      category: row.requests?.category ?? null,
      budget_min: row.requests?.budget_min ?? null,
      budget_max: row.requests?.budget_max ?? null,
      location: row.requests?.location ?? null,
      status: row.requests?.status ?? "active",
      posting_as: row.requests?.posting_as ?? null,
      created_at: row.requests?.created_at ?? new Date().toISOString(),
      username: row.requests?.profiles?.username ?? null,
    }));

    setJobs(mapped);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSaved();
    }, [fetchSaved]),
  );

  async function handleUnsave(saveId: string, jobId: string) {
    setJobs((prev) => prev.filter((j) => j.saveId !== saveId));
    await supabase.from("saved_jobs").delete().eq("id", saveId);
  }

  function renderItem({ item }: { item: SavedJob }) {
    const isEmployer = item.posting_as === "employer";
    const wage = formatWage(item.budget_min, item.budget_max);
    const catColor = catColors[item.category ?? "Other"] ?? catColors.Other;

    const msLeft =
      new Date(item.created_at).getTime() + 30 * 86400000 - Date.now();
    const daysLeft = Math.ceil(msLeft / 86400000);

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
        onPress={() => router.push(`/request/${item.id}` as any)}
      >
        <View style={[styles.cardStrip, { backgroundColor: catColor.bg }]}>
          <Text style={[styles.cardStripText, { color: catColor.text }]}>
            {t(CATEGORY_KEYS[item.category ?? "Other"] ?? "other")}
          </Text>
          <View style={styles.stripRight}>
            {daysLeft > 0 && (
              <View style={styles.expiryBadge}>
                <Feather name="clock" size={10} color={colors.warning} />
                <Text style={styles.expiryBadgeText}>{daysLeft}d left</Text>
              </View>
            )}
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor: isEmployer
                    ? colors.employerLight
                    : colors.primaryLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  { color: isEmployer ? colors.employer : colors.primaryDark },
                ]}
              >
                {isEmployer ? t("employer") : t("student")}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Pressable
              style={styles.unsaveBtn}
              onPress={() => handleUnsave(item.saveId, item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="bookmark" size={18} color={colors.primary} />
            </Pressable>
          </View>

          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            {item.location ? (
              <View style={styles.metaChip}>
                <Feather
                  name="map-pin"
                  size={11}
                  color={colors.secondaryText}
                />
                <Text style={styles.metaChipText} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            ) : null}
            {wage ? (
              <View style={styles.metaChip}>
                <Feather
                  name="dollar-sign"
                  size={11}
                  color={colors.secondaryText}
                />
                <Text style={styles.metaChipText}>{wage}</Text>
              </View>
            ) : null}
            {item.username ? (
              <View style={styles.metaChip}>
                <Feather name="user" size={11} color={colors.secondaryText} />
                <Text style={styles.metaChipText}>{item.username}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.page} edges={["top"]}>
      <View style={styles.navbar}>
        <Pressable style={styles.navBack} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.primaryText} />
        </Pressable>
        <Text style={styles.navTitle}>{t("savedJobs")}</Text>
        {!loading && <Text style={styles.navCount}>{jobs.length}</Text>}
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={colors.primary}
        />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => j.saveId}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            jobs.length === 0 && { flex: 1 },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={fetchSaved}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Feather name="bookmark" size={32} color={colors.primaryDark} />
              </View>
              <Text style={styles.emptyTitle}>{t("noSavedJobs")}</Text>
              <Text style={styles.emptySubtitle}>{t("noSavedJobsHint")}</Text>
              <Pressable style={styles.browseBtn} onPress={() => router.back()}>
                <Text style={styles.browseBtnText}>{t("findJobs")}</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
