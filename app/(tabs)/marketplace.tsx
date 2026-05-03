import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useTranslation } from "../../src/context/LanguageContext";
import { useMarketplaceMode } from "../../src/context/MarketplaceModeContext";
import { useTheme } from "../../src/context/ThemeContext";
import { JOB_TYPES } from "../../src/data/jobTypes";
import { supabase } from "../../src/lib/supabase";
import { getCategoryColors, makeStyles } from "./marketplace.styles";

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

const BROWSE_CATEGORIES = [
  { key: "All", emoji: "✨" },
  { key: "Hospitality", emoji: "🍽️" },
  { key: "Retail", emoji: "🛍️" },
  { key: "Tutoring", emoji: "📚" },
  { key: "Events", emoji: "🎉" },
  { key: "Delivery", emoji: "🚴" },
  { key: "IT", emoji: "💻" },
  { key: "Office", emoji: "💼" },
  { key: "Marketing", emoji: "📱" },
  { key: "Other", emoji: "⭐" },
] as const;

type JobRequest = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  job_type: string | null;
  schedule_type: string | null;
  rate_type: string | null;
  availability_tags: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  location: string | null;
  status: string;
  posting_as: string | null;
  created_at: string;
  is_urgent: boolean;
  is_boosted: boolean;
  boosted_until: string | null;
  profiles: { username: string | null } | null;
};

function timeAgo(dateStr: string, t: (key: string) => string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return (mins <= 1 ? "1" : String(mins)) + t("minAgo");
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + t("hAgo");
  const days = Math.floor(hrs / 24);
  return days + t("dAgo");
}

// Scoring: boosted (+1000) > urgent (+500) > recency (100→0 over 7 days)
function scoreJob(job: JobRequest): number {
  const now = Date.now();
  const isBoosted =
    job.is_boosted &&
    (!job.boosted_until || new Date(job.boosted_until).getTime() > now);
  const ageHours = (now - new Date(job.created_at).getTime()) / 3600000;
  return (
    (isBoosted ? 1000 : 0) +
    (job.is_urgent ? 500 : 0) +
    Math.max(0, Math.round(100 - (ageHours / 168) * 100))
  );
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

const RATE_LABELS: Record<string, string> = {
  hourly: "RON/h",
  "per-session": "RON/ședință",
  "per-project": "RON/proiect",
  daily: "RON/zi",
  negotiable: "negociabil",
};

function formatWage(
  min: number | null,
  max: number | null,
  rateType?: string | null,
) {
  const suffix = RATE_LABELS[rateType ?? ""] ?? "RON/h";
  if (!min && !max) return null;
  if (min && max) return `${min}\u2013${max} ${suffix}`;
  if (min) return `${min}+ ${suffix}`;
  return `~${max} ${suffix}`;
}

export default function JobsScreen() {
  const t = useTranslation();
  const { marketplaceMode } = useMarketplaceMode();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set());
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>(
    {},
  );
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newJobsCount, setNewJobsCount] = useState(0);
  const [showBrowse, setShowBrowse] = useState(false);
  const [browseJobType, setBrowseJobType] = useState("");
  const [filterMinWage, setFilterMinWage] = useState("");
  const [filterMaxWage, setFilterMaxWage] = useState("");
  const [browsePostingAs, setBrowsePostingAs] = useState<
    "all" | "employer" | "student"
  >("all");
  const [filterScheduleType, setFilterScheduleType] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("");
  const catColors = useMemo(
    () => getCategoryColors(colors.isDark),
    [colors.isDark],
  );
  const isFirstLoad = useRef(true);
  // Ref so the stable realtime channel can always call the latest fetchJobs
  const fetchJobsRef = useRef<((quiet?: boolean) => Promise<void>) | null>(
    null,
  );

  const fetchJobs = useCallback(async (quiet = false) => {
    if (!quiet) {
      if (isFirstLoad.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    let query = supabase
      .from("requests")
      .select(
        "id,title,description,category,job_type,schedule_type,rate_type,availability_tags,budget_min,budget_max,location,status,posting_as,created_at,is_urgent,is_boosted,boosted_until,profiles(username)",
      )
      .eq("status", "active")
      .gte("created_at", thirtyDaysAgo);
    const { data } = await query;
    const rawJobs = (data as unknown as JobRequest[]) ?? [];
    setJobs([...rawJobs].sort((a, b) => scoreJob(b) - scoreJob(a)));
    isFirstLoad.current = false;
    setNewJobsCount(0);

    // Fetch interest counts for the loaded jobs
    const jobIds = ((data ?? []) as { id: string }[]).map((j) => j.id);
    if (jobIds.length) {
      const { data: allInterests } = await supabase
        .from("job_interests")
        .select("request_id")
        .in("request_id", jobIds);
      const counts: Record<string, number> = {};
      (allInterests ?? []).forEach((i: any) => {
        counts[i.request_id] = (counts[i.request_id] ?? 0) + 1;
      });
      setInterestCounts(counts);
    }

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

      // Load interested jobs
      const { data: myInterests } = await supabase
        .from("job_interests")
        .select("request_id")
        .eq("user_id", user.id);
      setInterestedIds(
        new Set((myInterests ?? []).map((i: any) => i.request_id)),
      );

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
  }, []);

  // Keep ref pointing to latest fetchJobs so the stable channel can call it
  useEffect(() => {
    fetchJobsRef.current = fetchJobs;
  });

  // Realtime: stable channel (lives for component lifetime) — instant new-job notification
  useEffect(() => {
    const channel = supabase
      .channel("marketplace-rt-stable")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "requests" },
        () => {
          // Silently re-fetch so list updates immediately
          fetchJobsRef.current?.(true);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // mount/unmount only

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
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

  async function toggleInterest(jobId: string) {
    if (!userId) return;
    const isInterested = interestedIds.has(jobId);
    const nextIds = new Set(interestedIds);
    const nextCounts = { ...interestCounts };
    if (isInterested) {
      nextIds.delete(jobId);
      nextCounts[jobId] = Math.max(0, (nextCounts[jobId] ?? 1) - 1);
      await supabase
        .from("job_interests")
        .delete()
        .eq("user_id", userId)
        .eq("request_id", jobId);
    } else {
      nextIds.add(jobId);
      nextCounts[jobId] = (nextCounts[jobId] ?? 0) + 1;
      await supabase
        .from("job_interests")
        .insert({ user_id: userId, request_id: jobId });
    }
    setInterestedIds(nextIds);
    setInterestCounts(nextCounts);
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
    // Hide jobs the user has already applied to
    if (appliedIds.has(j.id)) return false;
    // Marketplace mode (global context)
    if (marketplaceMode !== "all" && j.posting_as !== marketplaceMode)
      return false;
    // Posting type from browse panel
    if (browsePostingAs !== "all" && j.posting_as !== browsePostingAs)
      return false;
    // Category filter (client-side)
    if (selectedCategory !== "All" && j.category !== selectedCategory)
      return false;
    // Job-type filter:
    // - For employer posts: match against their explicit job_type field
    // - Student posts pass through (they offer availability, not a role)
    if (browseJobType) {
      if (j.posting_as === "employer") {
        if (j.job_type !== browseJobType) return false;
      }
      // student posts are not filtered by job type
    }
    // Availability tag filter: for employer posts match against their availability_tags;
    // for student posts match against their availability_tags (when available they can work)
    if (filterAvailability) {
      if (!(j.availability_tags ?? []).includes(filterAvailability))
        return false;
    }
    // Schedule type filter (employer posts only; student posts pass through)
    if (filterScheduleType) {
      if (j.posting_as === "employer" && j.schedule_type !== filterScheduleType)
        return false;
    }
    // Wage range filter
    const minW = filterMinWage ? Number(filterMinWage) : null;
    const maxW = filterMaxWage ? Number(filterMaxWage) : null;
    if (minW !== null && !isNaN(minW)) {
      const jobTop = j.budget_max ?? j.budget_min ?? 0;
      if (jobTop < minW) return false;
    }
    if (maxW !== null && !isNaN(maxW)) {
      const jobBot = j.budget_min ?? j.budget_max ?? Infinity;
      if (jobBot > maxW) return false;
    }
    // Text search
    const q = search.toLowerCase();
    return (
      !q ||
      j.title.toLowerCase().includes(q) ||
      (j.description ?? "").toLowerCase().includes(q) ||
      (j.location ?? "").toLowerCase().includes(q)
    );
  });

  const activeFilterCount = [
    !!browseJobType,
    !!filterMinWage,
    !!filterMaxWage,
    browsePostingAs !== "all",
    !!filterScheduleType,
    !!filterAvailability,
  ].filter(Boolean).length;

  function clearAllFilters() {
    setSelectedCategory("All");
    setBrowseJobType("");
    setFilterMinWage("");
    setFilterMaxWage("");
    setBrowsePostingAs("all");
    setFilterScheduleType("");
    setFilterAvailability("");
  }

  function renderItem({ item }: { item: JobRequest }) {
    const isEmployer = item.posting_as === "employer";
    const wage = formatWage(item.budget_min, item.budget_max, item.rate_type);
    const posterName = item.profiles?.username ?? null;
    const isSaved = savedIds.has(item.id);
    const hasApplied = appliedIds.has(item.id);
    const isInterested = interestedIds.has(item.id);
    const iCount = interestCounts[item.id] ?? 0;
    const isBoostedActive =
      item.is_boosted &&
      (!item.boosted_until ||
        new Date(item.boosted_until).getTime() > Date.now());

    // Expiry: show badge only when 7 days or fewer remain
    const msLeft =
      new Date(item.created_at).getTime() + 30 * 86400000 - Date.now();
    const daysLeft = Math.ceil(msLeft / 86400000);
    const showExpiry = daysLeft > 0;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          isEmployer ? styles.cardEmployer : styles.cardStudent,
          pressed && styles.cardPressed,
        ]}
        onPress={() => router.push(`/request/${item.id}`)}
      >
        {/* Colored category strip */}
        <View style={styles.cardStrip}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.cardStripText}>
              {t(CATEGORY_KEYS[item.category ?? "Other"] ?? "other")}
            </Text>
            {item.is_urgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>{t("urgentBadge")}</Text>
              </View>
            )}
            {isBoostedActive && (
              <View style={styles.boostedBadge}>
                <Text style={styles.boostedBadgeText}>{t("boostedBadge")}</Text>
              </View>
            )}
          </View>
          <View style={styles.stripRight}>
            {showExpiry && (
              <View style={styles.expiryBadge}>
                <Feather name="clock" size={10} color={colors.warning} />
                <Text style={styles.expiryBadgeText}>{daysLeft}d left</Text>
              </View>
            )}
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
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
                  color={isSaved ? colors.primary : colors.mutedText}
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
              <View style={[styles.metaChip, styles.wageChip]}>
                <Feather name="dollar-sign" size={11} color={colors.success} />
                <Text style={[styles.metaChipText, styles.wageChipText]}>
                  {wage}
                </Text>
              </View>
            ) : null}
            {item.job_type ? (
              <View style={[styles.metaChip, styles.jobTypeChip]}>
                <Feather name="briefcase" size={11} color={colors.primary} />
                <Text
                  style={[styles.metaChipText, styles.jobTypeChipText]}
                  numberOfLines={1}
                >
                  {item.job_type}
                </Text>
              </View>
            ) : null}
            {item.schedule_type ? (
              <View style={[styles.metaChip, styles.scheduleChip]}>
                <Feather name="clock" size={11} color={colors.warning} />
                <Text
                  style={[styles.metaChipText, styles.scheduleChipText]}
                  numberOfLines={1}
                >
                  {item.schedule_type}
                </Text>
              </View>
            ) : null}
            {!isEmployer &&
              (item.availability_tags ?? []).slice(0, 3).map((tag) => (
                <View key={tag} style={[styles.metaChip, styles.availChip]}>
                  <Feather name="calendar" size={11} color={colors.success} />
                  <Text
                    style={[styles.metaChipText, styles.availChipText]}
                    numberOfLines={1}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
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
                <Text style={styles.timeAgo}>
                  {timeAgo(item.created_at, t)}
                </Text>
              </View>
            </View>
            {hasApplied ? (
              <View style={styles.appliedBadge}>
                <Feather name="check" size={12} color={colors.primary} />
                <Text style={styles.appliedBadgeText}>{t("appliedBadge")}</Text>
              </View>
            ) : (
              <View style={styles.footerRight}>
                {userId && (
                  <Pressable
                    style={[
                      styles.interestedBtn,
                      isInterested && styles.interestedBtnActive,
                    ]}
                    onPress={() => toggleInterest(item.id)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Feather
                      name="heart"
                      size={13}
                      color={isInterested ? "#EF4444" : colors.mutedText}
                    />
                    {iCount > 0 && (
                      <Text
                        style={[
                          styles.interestedCount,
                          isInterested && styles.interestedCountActive,
                        ]}
                      >
                        {iCount}
                      </Text>
                    )}
                  </Pressable>
                )}
                <View style={styles.applyBtn}>
                  <Text style={styles.applyBtnText}>{t("apply")}</Text>
                  <Feather name="arrow-right" size={13} color="#FFFFFF" />
                </View>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  }

  function renderBrowsePanel() {
    return (
      <Modal
        visible={showBrowse}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBrowse(false)}
      >
        <View style={[styles.browseModal, { backgroundColor: colors.bg }]}>
          {/* Header */}
          <View
            style={[styles.browseHeader, { borderBottomColor: colors.border }]}
          >
            <Pressable onPress={clearAllFilters} hitSlop={8}>
              <Text
                style={[styles.browseClearText, { color: colors.mutedText }]}
              >
                {t("clearAllFilters")}
              </Text>
            </Pressable>
            <Text
              style={[styles.browseTitleText, { color: colors.primaryText }]}
            >
              {t("browsePanel")}
            </Text>
            <Pressable onPress={() => setShowBrowse(false)} hitSlop={8}>
              <Feather name="x" size={20} color={colors.primaryText} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.browseContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Category grid */}
            <Text
              style={[styles.browseSectionLabel, { color: colors.mutedText }]}
            >
              {t("category")}
            </Text>
            <View style={styles.browseCatGrid}>
              {BROWSE_CATEGORIES.map(({ key, emoji }) => {
                const active = selectedCategory === key;
                const bubbleColor = catColors[key]?.bg ?? colors.surfaceAlt;
                return (
                  <Pressable
                    key={key}
                    style={[
                      styles.browseCatTile,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                      active && {
                        backgroundColor: colors.primaryLight,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => {
                      setSelectedCategory(
                        active && key !== "All" ? "All" : key,
                      );
                      if (active) setBrowseJobType("");
                    }}
                  >
                    <View
                      style={[
                        styles.browseCatEmojiWrap,
                        { backgroundColor: bubbleColor },
                      ]}
                    >
                      <Text style={styles.browseCatEmoji}>{emoji}</Text>
                    </View>
                    <Text
                      style={[
                        styles.browseCatLabel,
                        {
                          color: active ? colors.primary : colors.secondaryText,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {key === "All"
                        ? t("all")
                        : t(CATEGORY_KEYS[key] ?? "other")}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Job type chips — only if a real category is selected */}
            {selectedCategory !== "All" &&
              (JOB_TYPES[selectedCategory]?.length ?? 0) > 0 && (
                <>
                  <Text
                    style={[
                      styles.browseSectionLabel,
                      { color: colors.mutedText },
                    ]}
                  >
                    {t("jobType")}
                  </Text>
                  <View style={styles.browseTypeWrap}>
                    {JOB_TYPES[selectedCategory].map((type) => {
                      const active = browseJobType === type;
                      return (
                        <Pressable
                          key={type}
                          style={[
                            styles.browseTypeChip,
                            {
                              backgroundColor: colors.surfaceAlt,
                              borderColor: colors.border,
                            },
                            active && {
                              backgroundColor: colors.primary,
                              borderColor: colors.primary,
                            },
                          ]}
                          onPress={() => setBrowseJobType(active ? "" : type)}
                        >
                          <Text
                            style={[
                              styles.browseTypeText,
                              { color: active ? "#fff" : colors.secondaryText },
                            ]}
                          >
                            {type}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

            {/* Availability tags filter */}
            <Text
              style={[styles.browseSectionLabel, { color: colors.mutedText }]}
            >
              {t("availabilityFilter")}
            </Text>
            <View style={styles.browseTypeWrap}>
              {(
                [
                  ["weekdays", t("availWeekdays")],
                  ["mornings", t("availMorn")],
                  ["afternoons", t("availAft")],
                  ["evenings", t("availEve")],
                  ["nights", t("availNights")],
                  ["saturday", t("availSat")],
                  ["sunday", t("availSun")],
                  ["friday", t("availFri")],
                  ["flexible", t("availFlexible")],
                ] as [string, string][]
              ).map(([value, label]) => {
                const active = filterAvailability === value;
                return (
                  <Pressable
                    key={value}
                    style={[
                      styles.browseTypeChip,
                      {
                        backgroundColor: colors.surfaceAlt,
                        borderColor: colors.border,
                      },
                      active && {
                        backgroundColor: colors.success,
                        borderColor: colors.success,
                      },
                    ]}
                    onPress={() => setFilterAvailability(active ? "" : value)}
                  >
                    <Text
                      style={[
                        styles.browseTypeText,
                        { color: active ? "#fff" : colors.secondaryText },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Schedule type — relevant mainly for employer posts */}
            <Text
              style={[styles.browseSectionLabel, { color: colors.mutedText }]}
            >
              {t("scheduleTypeFilter")}
            </Text>
            <View style={styles.browseTypeWrap}>
              {(
                [
                  ["part-time", t("schedulePartTime")],
                  ["full-time", t("scheduleFullTime")],
                  ["weekend", t("scheduleWeekend")],
                  ["seasonal", t("scheduleSeasonal")],
                  ["remote", t("scheduleRemote")],
                  ["flexible", t("scheduleFlexible")],
                ] as [string, string][]
              ).map(([value, label]) => {
                const active = filterScheduleType === value;
                return (
                  <Pressable
                    key={value}
                    style={[
                      styles.browseTypeChip,
                      {
                        backgroundColor: colors.surfaceAlt,
                        borderColor: colors.border,
                      },
                      active && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setFilterScheduleType(active ? "" : value)}
                  >
                    <Text
                      style={[
                        styles.browseTypeText,
                        { color: active ? "#fff" : colors.secondaryText },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Posting type */}
            <Text
              style={[styles.browseSectionLabel, { color: colors.mutedText }]}
            >
              {t("postingType")}
            </Text>
            <View style={styles.browseToggleRow}>
              {(["all", "employer", "student"] as const).map((mode) => {
                const labels: Record<string, string> = {
                  all: t("all"),
                  employer: t("employer"),
                  student: t("student"),
                };
                const active = browsePostingAs === mode;
                return (
                  <Pressable
                    key={mode}
                    style={[
                      styles.browseToggleBtn,
                      {
                        backgroundColor: colors.surfaceAlt,
                        borderColor: colors.border,
                      },
                      active && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setBrowsePostingAs(mode)}
                  >
                    <Text
                      style={[
                        styles.browseToggleText,
                        { color: active ? "#fff" : colors.secondaryText },
                      ]}
                    >
                      {labels[mode]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Wage range */}
            <Text
              style={[styles.browseSectionLabel, { color: colors.mutedText }]}
            >
              {t("wageFilter")}
            </Text>
            <View style={styles.browseWageRow}>
              <View
                style={[
                  styles.browseWageBox,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.browseWageLbl, { color: colors.mutedText }]}
                >
                  {t("budgetMin")}
                </Text>
                <TextInput
                  style={[
                    styles.browseWageField,
                    { color: colors.primaryText },
                  ]}
                  value={filterMinWage}
                  onChangeText={setFilterMinWage}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.mutedText}
                />
              </View>
              <Text
                style={[styles.browseWageDash, { color: colors.mutedText }]}
              >
                —
              </Text>
              <View
                style={[
                  styles.browseWageBox,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.browseWageLbl, { color: colors.mutedText }]}
                >
                  {t("budgetMax")}
                </Text>
                <TextInput
                  style={[
                    styles.browseWageField,
                    { color: colors.primaryText },
                  ]}
                  value={filterMaxWage}
                  onChangeText={setFilterMaxWage}
                  keyboardType="numeric"
                  placeholder="∞"
                  placeholderTextColor={colors.mutedText}
                />
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer */}
          <View
            style={[
              styles.browseFooter,
              {
                borderTopColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Pressable
              style={[
                styles.browseApplyBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => setShowBrowse(false)}
            >
              <Text style={styles.browseApplyText}>
                {t("showResults")} ({filtered.length})
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.page}>
      {/* Compact header: search + filter + bookmark */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.searchBox}>
            <Feather name="search" size={15} color={colors.mutedText} />
            <TextInput
              style={styles.searchInput}
              placeholder={t("searchJobs")}
              placeholderTextColor={colors.mutedText}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSubmitEditing={() => commitSearch(search)}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Feather name="x" size={15} color={colors.mutedText} />
              </Pressable>
            )}
          </View>
          {/* Filter button */}
          <Pressable
            style={[
              styles.headerIconBtn,
              activeFilterCount > 0 && styles.headerIconBtnActive,
            ]}
            onPress={() => setShowBrowse(true)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Feather
              name="sliders"
              size={18}
              color={
                activeFilterCount > 0 ? colors.primary : colors.primaryDark
              }
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={styles.headerIconBtn}
            onPress={() => router.push("/saved-jobs" as any)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Feather name="bookmark" size={18} color={colors.primaryDark} />
          </Pressable>
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
                <Feather name="clock" size={11} color={colors.mutedText} />
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
          <Feather name="bell" size={14} color={colors.primaryDark} />
          <Text style={styles.newJobsBannerText}>
            {newJobsCount} {t("newJobsBanner")} — {t("tapToRefresh")}
          </Text>
        </Pressable>
      )}

      {/* Profile completeness banner */}
      {profileIncomplete && showBanner && (
        <View style={styles.banner}>
          <Feather name="user" size={15} color={colors.primaryDark} />
          <Text style={styles.bannerText}>{t("completeProfileBanner")}</Text>
          <View style={styles.bannerActions}>
            <Pressable onPress={() => router.push("/profile" as any)}>
              <Text style={styles.bannerLink}>{t("completeNow")}</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowBanner(false)}
              style={styles.bannerDismiss}
            >
              <Feather name="x" size={14} color={colors.primaryDark} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Quick category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        {(Object.keys(CATEGORY_KEYS) as string[]).map((cat) => {
          const active = cat === selectedCategory;
          return (
            <Pressable
              key={cat}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                setSelectedCategory(active ? "All" : cat);
                if (active) setBrowseJobType("");
              }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {cat === "All" ? t("all") : t(CATEGORY_KEYS[cat] ?? "other")}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Active filter chips row — shown only when browse panel filters are active */}
      {activeFilterCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.activeChipsScroll}
          contentContainerStyle={styles.activeChipsRow}
        >
          {browseJobType ? (
            <Pressable
              style={styles.activeChip}
              onPress={() => setBrowseJobType("")}
            >
              <Text style={styles.activeChipText}>{browseJobType}</Text>
              <Feather name="x" size={11} color={colors.primary} />
            </Pressable>
          ) : null}
          {browsePostingAs !== "all" && (
            <Pressable
              style={styles.activeChip}
              onPress={() => setBrowsePostingAs("all")}
            >
              <Text style={styles.activeChipText}>
                {browsePostingAs === "employer" ? t("employer") : t("student")}
              </Text>
              <Feather name="x" size={11} color={colors.primary} />
            </Pressable>
          )}
          {filterMinWage ? (
            <Pressable
              style={styles.activeChip}
              onPress={() => setFilterMinWage("")}
            >
              <Text style={styles.activeChipText}>≥{filterMinWage} RON</Text>
              <Feather name="x" size={11} color={colors.primary} />
            </Pressable>
          ) : null}
          {filterMaxWage ? (
            <Pressable
              style={styles.activeChip}
              onPress={() => setFilterMaxWage("")}
            >
              <Text style={styles.activeChipText}>≤{filterMaxWage} RON</Text>
              <Feather name="x" size={11} color={colors.primary} />
            </Pressable>
          ) : null}
          {filterScheduleType ? (
            <Pressable
              style={styles.activeChip}
              onPress={() => setFilterScheduleType("")}
            >
              <Text style={styles.activeChipText}>{filterScheduleType}</Text>
              <Feather name="x" size={11} color={colors.primary} />
            </Pressable>
          ) : null}
          {filterAvailability ? (
            <Pressable
              style={[styles.activeChip, styles.activeChipAvail]}
              onPress={() => setFilterAvailability("")}
            >
              <Text style={[styles.activeChipText, styles.activeChipAvailText]}>
                {filterAvailability}
              </Text>
              <Feather name="x" size={11} color={colors.success} />
            </Pressable>
          ) : null}
          <Pressable style={styles.clearChip} onPress={clearAllFilters}>
            <Text style={styles.clearChipText}>{t("clearAllFilters")}</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* Save search pill — visible when a filter or search is active */}
      {userId && (search.trim() || selectedCategory !== "All") && (
        <Pressable style={styles.saveSearchBtn} onPress={saveSearch}>
          <Feather name="bell" size={12} color={colors.primaryDark} />
          <Text style={styles.saveSearchText}>{t("saveSearch")}</Text>
        </Pressable>
      )}

      {loading ? (
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={colors.primary}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={filtered}
            keyExtractor={(j) => j.id}
            renderItem={renderItem}
            style={{ flex: 1 }}
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
                  <Feather
                    name="briefcase"
                    size={32}
                    color={colors.mutedText}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {activeFilterCount > 0
                    ? t("noJobsMatchFilters")
                    : t("noJobsFound")}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeFilterCount > 0
                    ? t("adjustFilters")
                    : t("tryAdjustingSearch")}
                </Text>
                {activeFilterCount > 0 ? (
                  <Pressable
                    style={styles.refreshBtn}
                    onPress={clearAllFilters}
                  >
                    <Text style={styles.refreshBtnText}>
                      {t("clearAllFilters")}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.refreshBtn}
                    onPress={() => fetchJobs()}
                  >
                    <Text style={styles.refreshBtnText}>{t("refresh")}</Text>
                  </Pressable>
                )}
              </View>
            }
          />
        </View>
      )}
      {renderBrowsePanel()}
    </View>
  );
}
