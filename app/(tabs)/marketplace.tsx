import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../src/context/LanguageContext";
import { supabase } from "../../src/lib/supabase";
import { styles, theme, CATEGORY_COLORS } from "./marketplace.styles";

const CATEGORIES = [
  "All","Hospitality","Retail","Tutoring","Events","Delivery","IT","Office","Marketing","Other",
] as const;

const CATEGORY_KEYS: Record<string, string> = {
  All:"all",Hospitality:"hospitality",Retail:"retail",Tutoring:"tutoring",
  Events:"events",Delivery:"delivery",IT:"it",Office:"office",Marketing:"marketing",Other:"other",
};

type JobRequest = {
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
  profiles: { username: string | null } | null;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "1m ago" : mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  const days = Math.floor(hrs / 24);
  return days + "d ago";
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatWage(min: number | null, max: number | null) {
  if (!min && !max) return null;
  if (min && max) return `${min}–${max} RON/h`;
  if (min) return `${min}+ RON/h`;
  return `~${max} RON/h`;
}

export default function JobsScreen() {
  const t = useTranslation();
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("requests")
      .select("id,title,description,category,budget_min,budget_max,location,status,posting_as,created_at,profiles(username)")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (selectedCategory !== "All") query = query.eq("category", selectedCategory);
    const { data } = await query;
    setJobs((data as unknown as JobRequest[]) ?? []);
    setLoading(false);
  }, [selectedCategory]);

  useFocusEffect(useCallback(() => { fetchJobs(); }, [fetchJobs]));

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    return !q || j.title.toLowerCase().includes(q) ||
      j.description?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q);
  });

  function renderItem({ item }: { item: JobRequest }) {
    const isEmployer = item.posting_as === "employer";
    const wage = formatWage(item.budget_min, item.budget_max);
    const catColor = CATEGORY_COLORS[item.category ?? "Other"] ?? CATEGORY_COLORS.Other;
    const posterName = item.profiles?.username ?? null;

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => router.push(`/request/${item.id}`)}
      >
        {/* Colored category strip */}
        <View style={[styles.cardStrip, { backgroundColor: catColor.bg }]}>
          <Text style={[styles.cardStripText, { color: catColor.text }]}>
            {t(CATEGORY_KEYS[item.category ?? "Other"] ?? "other")}
          </Text>
          <View style={[styles.roleBadge, {
            backgroundColor: isEmployer ? theme.employerLight : theme.primaryLight,
          }]}>
            <Text style={[styles.roleBadgeText, {
              color: isEmployer ? theme.employer : theme.primaryDark,
            }]}>
              {isEmployer ? t("employer") : t("student")}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          ) : null}

          {/* Meta chips */}
          <View style={styles.metaRow}>
            {item.location ? (
              <View style={styles.metaChip}>
                <Feather name="map-pin" size={11} color={theme.secondaryText} />
                <Text style={styles.metaChipText} numberOfLines={1}>{item.location}</Text>
              </View>
            ) : null}
            {wage ? (
              <View style={[styles.metaChip, styles.wageChip]}>
                <Feather name="dollar-sign" size={11} color={theme.success} />
                <Text style={[styles.metaChipText, styles.wageChipText]}>{wage}</Text>
              </View>
            ) : null}
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.posterRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(posterName)}</Text>
              </View>
              <View>
                <Text style={styles.posterName} numberOfLines={1}>
                  {posterName ?? t("anonymous")}
                </Text>
                <Text style={styles.timeAgo}>{timeAgo(item.created_at)}</Text>
              </View>
            </View>
            <View style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>{t("apply")}</Text>
              <Feather name="arrow-right" size={13} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.page} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("findJobs")}</Text>
        <Text style={styles.headerSub}>{filtered.length} {t("jobsAvailable")}</Text>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={theme.mutedText} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("searchJobs")}
            placeholderTextColor={theme.mutedText}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={theme.mutedText} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Category chips */}
      <FlatList
        data={CATEGORIES as unknown as string[]}
        keyExtractor={c => c}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        renderItem={({ item: cat }) => {
          const active = cat === selectedCategory;
          const catColor = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other;
          return (
            <Pressable
              style={[styles.chip, active && { backgroundColor: catColor.bg, borderColor: catColor.text }]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.chipText, active && { color: catColor.text, fontWeight: "800" }]}>
                {cat === "All" ? t("all") : t(CATEGORY_KEYS[cat] ?? "other")}
              </Text>
            </Pressable>
          );
        }}
      />

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={j => j.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, filtered.length === 0 && { flex: 1 }]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={fetchJobs}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Feather name="briefcase" size={32} color={theme.mutedText} />
              </View>
              <Text style={styles.emptyTitle}>{t("noJobsFound")}</Text>
              <Text style={styles.emptySubtitle}>{t("tryAdjustingSearch")}</Text>
              <Pressable style={styles.refreshBtn} onPress={fetchJobs}>
                <Text style={styles.refreshBtnText}>{t("refresh")}</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
