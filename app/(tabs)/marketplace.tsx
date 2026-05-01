import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useTranslation } from "../../src/context/LanguageContext";
import { supabase } from "../../src/lib/supabase";
import { CATEGORY_COLORS, styles, theme } from "./marketplace.styles";

const CATEGORIES = [
  "All",
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
  All: "all",
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
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newJobsCount, setNewJobsCount] = useState(0);
  const isFirstLoad = useRef(true);

  const fetchJobs = useCallback(async () => {
    if (isFirstLoad.current) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    let query = supabase
      .from("requests")
      .select(
        "id,title,description,category,budget_min,budget_max,location,status,posting_as,created_at,profiles(username)",
      )
      .eq("status", "active")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false });
    if (selectedCategory !== "All")
      query = query.eq("category", selectedCategory);
    const { data } = await query;
    setJobs((data as unknown as JobRequest[]) ?? []);
    isFirstLoad.current = false;
    setNewJobsCount(0);

    if (user) {
      // Load saved jobs
      const { data: saved } = await supabase
        .from("saved_jobs")
        .select("request_id")
        .eq("user_id", user.id);
      setSavedIds(new Set((saved ?? []).map((s: any) => s.request_id)));

      // Load applied jobs (non-withdrawn)
      const { data: applied } = await supabase
        .from("offers")
        .select("request_id")
        .eq("seller_id", user.id)
        .neq("status", "withdrawn");
      setAppliedIds(new Set((applied ?? []).map((a: any) => a.request_id)));

      // Check profile completeness
      const { data: prof } = await supabase
        .from("profiles")
        .select("bio, skills, university")
        .eq("id", user.id)
        .single();
      if (prof) {
        const incomplete =
          !prof.bio || !prof.university || !prof.skills?.length;
        setProfileIncomplete(incomplete);
      }
    }
    setLoading(false);
    setRefreshing(false);
  }, [selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
      const channel = supabase
        .channel("marketplace-new-jobs")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "requests" },
          () => setNewJobsCount((n) => n + 1),
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }, [fetchJobs]),
  );

  async function toggleSave(jobId: string) {
    if (!userId) return;
    const isSaved = savedIds.has(jobId);
    const next = new Set(savedIds);
    if (isSaved) {
      next.delete(jobId);
      await supabase
        .from("saved_jobs")
        .delete()
        .eq("user_id", userId)
        .eq("request_id", jobId);
    } else {
      next.add(jobId);
      await supabase
        .from("saved_jobs")
        .insert({ user_id: userId, request_id: jobId });
    }
    setSavedIds(next);
  }

  async function saveSearch() {
    if (!userId) return;
    const keyword = search.trim() || null;
    const category = selectedCategory !== "All" ? selectedCategory : null;
    if (!keyword && !category) return;
    const { error } = await supabase
      .from("job_alerts")
      .insert({ user_id: userId, keyword, category });
    if (!error) Alert.alert(t("searchSaved"));
  }

  function commitSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== trimmed);
      return [trimmed, ...filtered].slice(0, 5);
    });
  }

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    return (
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.description?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q)
    );
  });

  function renderItem({ item }: { item: JobRequest }) {
    const isEmployer = item.posting_as === "employer";
    const wage = formatWage(item.budget_min, item.budget_max);
    const catColor =
      CATEGORY_COLORS[item.category ?? "Other"] ?? CATEGORY_COLORS.Other;
    const posterName = item.profiles?.username ?? null;
    const isSaved = savedIds.has(item.id);
    const hasApplied = appliedIds.has(item.id);

    // Expiry: auto-expires 30 days after posting
    const msLeft =
      new Date(item.created_at).getTime() + 30 * 86400000 - Date.now();
    const daysLeft = Math.ceil(msLeft / 86400000);
    const expiringSoon = daysLeft > 0;

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
          <View style={styles.stripRight}>
            {expiringSoon && (
              <View style={styles.expiryBadge}>
                <Feather name="clock" size={10} color="#92400E" />
                <Text style={styles.expiryBadgeText}>{daysLeft}d left</Text>
              </View>
            )}
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor: isEmployer
                    ? theme.employerLight
                    : theme.primaryLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  { color: isEmployer ? theme.employer : theme.primaryDark },
                ]}
              >
                {isEmployer ? t("employer") : t("student")}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={2}>
              {item.title}
            </Text>
            {userId && (
              <Pressable
                style={styles.bookmarkBtn}
                onPress={() => toggleSave(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather
                  name={isSaved ? "bookmark" : "bookmark"}
                  size={18}
                  color={isSaved ? theme.primary : theme.mutedText}
                />
              </Pressable>
            )}
          </View>

          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          {/* Meta chips */}
          <View style={styles.metaRow}>
            {item.location ? (
              <View style={styles.metaChip}>
                <Feather name="map-pin" size={11} color={theme.secondaryText} />
                <Text style={styles.metaChipText} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            ) : null}
            {wage ? (
              <View style={[styles.metaChip, styles.wageChip]}>
                <Feather name="dollar-sign" size={11} color={theme.success} />
                <Text style={[styles.metaChipText, styles.wageChipText]}>
                  {wage}
                </Text>
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
            {hasApplied ? (
              <View style={styles.appliedBadge}>
                <Feather name="check" size={12} color={theme.primary} />
                <Text style={styles.appliedBadgeText}>{t("appliedBadge")}</Text>
              </View>
            ) : (
              <View style={styles.applyBtn}>
                <Text style={styles.applyBtnText}>{t("apply")}</Text>
                <Feather name="arrow-right" size={13} color="#FFFFFF" />
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{t("findJobs")}</Text>
            <Text style={styles.headerSub}>
              {filtered.length} {t("jobsAvailable")}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 4 }}>
            <Pressable
              onPress={() => router.push("/saved-searches" as any)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="bell" size={20} color={theme.primaryDark} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/saved-jobs" as any)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="bookmark" size={22} color={theme.primaryDark} />
            </Pressable>
          </View>
        </View>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={theme.mutedText} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("searchJobs")}
            placeholderTextColor={theme.mutedText}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => commitSearch(search)}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={theme.mutedText} />
            </Pressable>
          )}
        </View>

        {/* Recent searches */}
        {search.length === 0 && recentSearches.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.recentRow}
            contentContainerStyle={styles.recentContent}
          >
            {recentSearches.map((s) => (
              <Pressable
                key={s}
                style={styles.recentChip}
                onPress={() => setSearch(s)}
              >
                <Feather name="clock" size={11} color={theme.mutedText} />
                <Text style={styles.recentChipText}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* New jobs notification banner */}
      {newJobsCount > 0 && (
        <Pressable
          style={styles.newJobsBanner}
          onPress={() => {
            setNewJobsCount(0);
            fetchJobs();
          }}
        >
          <Feather name="bell" size={14} color={theme.primaryDark} />
          <Text style={styles.newJobsBannerText}>
            {newJobsCount} {t("newJobsBanner")} — {t("tapToRefresh")}
          </Text>
        </Pressable>
      )}

      {/* Profile completeness banner */}
      {profileIncomplete && showBanner && (
        <View style={styles.banner}>
          <Feather name="user" size={15} color={theme.primaryDark} />
          <Text style={styles.bannerText}>{t("completeProfileBanner")}</Text>
          <View style={styles.bannerActions}>
            <Pressable onPress={() => router.push("/profile" as any)}>
              <Text style={styles.bannerLink}>{t("completeNow")}</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowBanner(false)}
              style={styles.bannerDismiss}
            >
              <Feather name="x" size={14} color={theme.primaryDark} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Category chips — ScrollView for reliable spacing */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        {(CATEGORIES as unknown as string[]).map((cat) => {
          const active = cat === selectedCategory;
          return (
            <Pressable
              key={cat}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {cat === "All" ? t("all") : t(CATEGORY_KEYS[cat] ?? "other")}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Save search pill — visible when a filter or search is active */}
      {userId && (search.trim() || selectedCategory !== "All") && (
        <Pressable style={styles.saveSearchBtn} onPress={saveSearch}>
          <Feather name="bell" size={12} color={theme.primaryDark} />
          <Text style={styles.saveSearchText}>{t("saveSearch")}</Text>
        </Pressable>
      )}

      {loading ? (
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={theme.primary}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(j) => j.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            filtered.length === 0 && { flex: 1 },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={fetchJobs}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Feather name="briefcase" size={32} color={theme.mutedText} />
              </View>
              <Text style={styles.emptyTitle}>{t("noJobsFound")}</Text>
              <Text style={styles.emptySubtitle}>
                {t("tryAdjustingSearch")}
              </Text>
              <Pressable style={styles.refreshBtn} onPress={fetchJobs}>
                <Text style={styles.refreshBtnText}>{t("refresh")}</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}
