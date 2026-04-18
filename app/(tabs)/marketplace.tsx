import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { ImageViewer } from "../../src/components/ImageViewer";
import {
  SchedulePicker,
  WeekSchedule,
  emptyWeek,
} from "../../src/components/SchedulePicker";
import { useCurrency } from "../../src/context/CurrencyContext";
import { useTranslation } from "../../src/context/LanguageContext";
import { supabase } from "../../src/lib/supabase";
import { styles, theme } from "./marketplace.styles";

// Category display names (kept in English for database filtering)
const categories = [
  "All",
  "Vehicles",
  "Real Estate",
  "Services",
  "Electronics & Tech",
  "Fashion & Personal",
  "Other",
] as const;

// Map English names to translation keys
const categoryTranslationKeys: Record<string, string> = {
  All: "all",
  Vehicles: "vehicles",
  "Real Estate": "realEstate",
  Services: "services",
  "Electronics & Tech": "electronics",
  "Fashion & Personal": "fashion",
  Other: "other",
};

type Category = (typeof categories)[number];

type RequestRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  type: "product" | "service";
  status: "active" | "matched" | "closed";
  created_at: string;
  location: string | null;
  open_budget: boolean | null;
  posting_as: string | null;
  budget_type: string | null;
  timeline: string | null;
  preferred_schedule: string | null;
  duration: string | null;
  workers_needed: number | null;
  work_mode: string | null;
  experience_level: string | null;
  equipment: string | null;
  scheduled_date: string | null;
  special_requirements: string | null;
  photos: string[] | null;
  profiles?: { display_name: string | null } | null;
};

const scheduleKeys: Record<string, string> = {
  anytime: "scheduleAnytime",
  weekdays: "scheduleWeekdays",
  weekends: "scheduleWeekends",
  specific_date: "scheduleSpecificDate",
};

const durationKeys: Record<string, string> = {
  few_hours: "durationHours",
  full_day: "durationDay",
  multi_day: "durationMultiDay",
  recurring: "durationRecurring",
};

const workModeKeys: Record<string, string> = {
  onsite: "workOnsite",
  remote: "workRemote",
  hybrid: "workHybrid",
};

const experienceKeys: Record<string, string> = {
  any: "experienceAny",
  beginner: "experienceBeginner",
  experienced: "experienceExperienced",
  expert: "experienceExpert",
};

const budgetTypeKeys: Record<string, string> = {
  per_hour: "budgetPerHour",
  per_day: "budgetPerDay",
  fixed: "budgetFixed",
};

const equipmentKeys: Record<string, string> = {
  not_needed: "equipmentNotNeeded",
  pro_provides: "equipmentPro",
  client_provides: "equipmentClient",
};

const postingAsKeys: Record<string, string> = {
  seeking: "postingSeeking",
  offering: "postingOffering",
};

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = Math.min(120, width * 0.28);

export default function MarketplaceScreen() {
  const t = useTranslation();

  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityMap, setAvailabilityMap] = useState<
    Map<string, WeekSchedule>
  >(new Map());

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadRequests = useCallback(async () => {
    setLoading(true);

    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user.id ?? null;

    // If logged in, fetch their swipes first, so we can exclude them
    let excludedIds: string[] = [];
    if (userId) {
      const { data: swipes, error: swipeErr } = await supabase
        .from("request_swipes")
        .select("request_id")
        .eq("user_id", userId);

      if (swipeErr) {
        console.log("Swipe fetch error:", swipeErr);
      }

      excludedIds = (swipes ?? []).map((s: any) => s.request_id);
    }

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) console.log("getUser error:", userErr);
    const user = userRes?.user ?? null;

    let query = supabase
      .from("requests")
      .select(
        `
    id,
    title,
    description,
    category,
    budget_min,
    budget_max,
    type,
    status,
    created_at,
    location,
    user_id,
    open_budget,
    posting_as,
    budget_type,
    timeline,
    preferred_schedule,
    duration,
    workers_needed,
    work_mode,
    experience_level,
    equipment,
    scheduled_date,
    special_requirements,
    photos,
    profiles!requests_user_id_fkey (
      display_name
    )
  `,
      )
      .in("status", ["active", "matched"])
      .order("created_at", { ascending: false });

    // ✅ hide my own requests in marketplace
    if (user) {
      query = query.neq("user_id", user.id);
    }

    // ✅ exclude swiped request ids (quote UUIDs correctly)
    if (excludedIds.length > 0) {
      const quoted = excludedIds.map((id) => `"${id}"`).join(",");
      query = query.not("id", "in", `(${quoted})`);
    }

    const { data, error } = await query;

    if (error) {
      console.log("Marketplace query error:", error);
      Alert.alert(t("marketplaceError"), error.message);
      setRequests([]);
      setCurrentIndex(0);
      setLoading(false);
      return;
    }

    const reqList = (data ?? []) as any as RequestRow[];
    setRequests(reqList);
    setCurrentIndex(0);

    // Load availability for all requests
    if (reqList.length > 0) {
      const ids = reqList.map((r) => r.id);
      const { data: avail } = await supabase
        .from("request_availability")
        .select("id,request_id,day_of_week,start_time,end_time,is_booked,date")
        .in("request_id", ids)
        .order("day_of_week")
        .order("start_time");

      const map = new Map<string, WeekSchedule>();
      (avail ?? []).forEach((row: any) => {
        if (!map.has(row.request_id)) map.set(row.request_id, emptyWeek());
        const week = map.get(row.request_id)!;
        const day = week[row.day_of_week];
        day.enabled = true;
        day.slots.push({
          id: row.id,
          start: row.start_time.slice(0, 5),
          end: row.end_time.slice(0, 5),
          date: row.date ?? undefined,
        });
      });
      setAvailabilityMap(map);
    } else {
      setAvailabilityMap(new Map());
    }

    setLoading(false);
  }, [t]);

  // Refresh when you come back from the modal (or any time this tab focuses)
  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests]),
  );

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((req) => {
      const matchesCategory =
        selectedCategory === "All" || req.category === selectedCategory;
      const matchesSearch =
        q.length === 0 ||
        req.title.toLowerCase().includes(q) ||
        req.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [requests, selectedCategory, searchQuery]);

  const currentRequest = filteredRequests[currentIndex];

  const goNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSwipe = async (direction: "left" | "right") => {
    if (!currentRequest) return;

    // Always move UI forward immediately so the card disappears
    goNext();

    const { data } = await supabase.auth.getSession();
    const session = data.session;

    // If not logged in:
    // - allow browsing
    // - BUT we cannot save the swipe to DB, so it may reappear after refetch
    if (!session) {
      if (direction === "right") {
        router.push({
          pathname: "/sign-in",
          params: { redirect: "/(tabs)/marketplace" },
        } as any);
      }
      return;
    }

    // Save swipe to DB (prevents it from reappearing)
    await supabase.from("request_swipes").upsert({
      user_id: session.user.id,
      request_id: currentRequest.id,
      direction,
    });
  };

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Feather name="search" size={18} color={theme.secondaryText} />
            <TextInput
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t);
                setCurrentIndex(0);
              }}
              placeholder={t("searchRequests")}
              placeholderTextColor={theme.secondaryText}
              style={styles.searchInput}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => router.push("/filters")}
          >
            <Feather name="sliders" size={18} color={theme.primaryText} />
          </Pressable>
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {categories.map((c) => {
            const selected = c === selectedCategory;
            return (
              <Pressable
                key={c}
                onPress={() => {
                  setSelectedCategory(c);
                  setCurrentIndex(0);
                }}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {t(categoryTranslationKeys[c])}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Swipe Area */}
      <View style={styles.swipeArea}>
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t("loading")}</Text>
            <Text style={styles.emptySubtitle}>{t("fetchingRequests")}</Text>
          </View>
        ) : currentIndex >= filteredRequests.length || !currentRequest ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t("noMoreRequests")}</Text>
            <Text style={styles.emptySubtitle}>{t("tryCategoryOrSearch")}</Text>

            <Pressable style={styles.refreshBtn} onPress={loadRequests}>
              <Text style={styles.refreshBtnText}>{t("refresh")}</Text>
            </Pressable>
          </View>
        ) : (
          <RequestCard
            request={currentRequest}
            remaining={filteredRequests.length - currentIndex}
            total={filteredRequests.length}
            onSwipe={handleSwipe}
            t={t}
            availability={availabilityMap.get(currentRequest.id)}
          />
        )}
      </View>

      {/* Bottom action buttons */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => handleSwipe("left")}
          disabled={loading || !currentRequest}
        >
          <Feather name="x" size={22} color={theme.primaryText} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => handleSwipe("right")}
          disabled={loading || !currentRequest}
        >
          <Feather name="check" size={22} color={theme.primaryText} />
        </Pressable>
      </View>
    </View>
  );
}

function RequestCard({
  request,
  remaining,
  total,
  onSwipe,
  t,
  availability,
}: {
  request: RequestRow;
  remaining: number;
  total: number;
  onSwipe: (direction: "left" | "right") => void;
  t: (key: string) => string;
  availability?: WeekSchedule;
}) {
  const { formatPrice } = useCurrency();
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [expanded, setExpanded] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const rotate = translate.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ["-10deg", "0deg", "10deg"],
  });

  const leftOpacity = translate.x.interpolate({
    inputRange: [-200, -80, 0],
    outputRange: [1, 1, 0],
    extrapolate: "clamp",
  });

  const rightOpacity = translate.x.interpolate({
    inputRange: [0, 80, 200],
    outputRange: [0, 1, 1],
    extrapolate: "clamp",
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: Animated.event(
        [null, { dx: translate.x, dy: translate.y }],
        { useNativeDriver: false },
      ),
      onPanResponderRelease: (_evt, g) => {
        const dx = g.dx;

        if (dx > SWIPE_THRESHOLD) {
          Animated.timing(translate, {
            toValue: { x: width + 220, y: 0 },
            duration: 180,
            useNativeDriver: false,
          }).start(() => {
            translate.setValue({ x: 0, y: 0 });
            onSwipe("right");
          });
          return;
        }

        if (dx < -SWIPE_THRESHOLD) {
          Animated.timing(translate, {
            toValue: { x: -width - 220, y: 0 },
            duration: 180,
            useNativeDriver: false,
          }).start(() => {
            translate.setValue({ x: 0, y: 0 });
            onSwipe("left");
          });
          return;
        }

        Animated.spring(translate, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    }),
  ).current;

  const progress = total === 0 ? 0 : (remaining / total) * 100;
  const postedBy = request.profiles?.display_name ?? null;
  const photos = request.photos ?? [];

  const budgetText = request.open_budget
    ? t("openBudget")
    : request.budget_type &&
        request.budget_type !== "range" &&
        budgetTypeKeys[request.budget_type]
      ? `${formatPrice(request.budget_min)} ${t(budgetTypeKeys[request.budget_type])}`
      : `${formatPrice(request.budget_min)} \u2013 ${formatPrice(request.budget_max)}`;

  const detailRows: { label: string; value: string }[] = [];
  if (request.preferred_schedule && scheduleKeys[request.preferred_schedule])
    detailRows.push({
      label: t("preferredSchedule"),
      value: t(scheduleKeys[request.preferred_schedule]),
    });
  if (request.preferred_schedule === "specific_date" && request.scheduled_date)
    detailRows.push({
      label: t("scheduledDate"),
      value: request.scheduled_date,
    });
  if (request.duration && durationKeys[request.duration])
    detailRows.push({
      label: t("durationLabel"),
      value: t(durationKeys[request.duration]),
    });
  if (request.workers_needed != null)
    detailRows.push({
      label: t("workersLabel"),
      value: String(request.workers_needed),
    });
  if (request.work_mode && workModeKeys[request.work_mode])
    detailRows.push({
      label: t("workModeLabel"),
      value: t(workModeKeys[request.work_mode]),
    });
  if (request.experience_level && experienceKeys[request.experience_level])
    detailRows.push({
      label: t("experienceLabel"),
      value: t(experienceKeys[request.experience_level]),
    });
  if (request.equipment && equipmentKeys[request.equipment])
    detailRows.push({
      label: t("equipmentLabel"),
      value: t(equipmentKeys[request.equipment]),
    });

  return (
    <View style={styles.cardWrap}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <View style={styles.progressPill}>
          <Text style={styles.progressPillText}>
            {remaining} {t("remaining_left")}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Stack background */}
      <View style={styles.stack}>
        <View style={styles.stackBg1} />
        <View style={styles.stackBg2} />

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.card,
            {
              transform: [
                { translateX: translate.x },
                { translateY: translate.y },
                { rotate },
              ],
            },
          ]}
        >
          {/* Scrollable content */}
          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardBody}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
          >
            {/* Photo strip at top */}
            {photos.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbRow}
              >
                {photos.map((uri, i) => (
                  <Pressable
                    key={i}
                    onPress={() => {
                      setViewerIndex(i);
                      setViewerVisible(true);
                    }}
                  >
                    <Image
                      source={{ uri }}
                      style={styles.thumb}
                      resizeMode="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {/* Badges */}
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.badge,
                  request.posting_as === "offering"
                    ? styles.badgeOffering
                    : styles.badgeSeeking,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    request.posting_as === "offering"
                      ? styles.badgeTextOffering
                      : styles.badgeTextSeeking,
                  ]}
                >
                  {request.posting_as === "offering"
                    ? t("postingOffering")
                    : t("postingSeeking")}
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {t(categoryTranslationKeys[request.category] || "other")}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{request.title}</Text>
            {!!postedBy && (
              <Text style={styles.postedBy}>
                {t("postedBy")} {postedBy}
              </Text>
            )}

            {/* Budget + location */}
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Feather
                  name="dollar-sign"
                  size={16}
                  color={theme.secondaryText}
                />
                <Text style={styles.detailText}>{budgetText}</Text>
              </View>
              {!!request.location && (
                <View style={styles.detailRow}>
                  <Feather
                    name="map-pin"
                    size={16}
                    color={theme.secondaryText}
                  />
                  <Text style={styles.detailText}>{request.location}</Text>
                </View>
              )}
            </View>

            {/* Description — truncated when collapsed */}
            {!!request.description && (
              <Pressable onPress={() => setExpanded((prev) => !prev)}>
                <Text style={styles.desc} numberOfLines={expanded ? 0 : 1}>
                  {request.description}
                </Text>
                <Text style={styles.expandInline}>
                  {expanded ? t("showLess") : t("showMore")}
                </Text>
              </Pressable>
            )}

            {/* Detail info — max 3 rows, indicator if more exist */}
            {detailRows.length > 0 &&
              (() => {
                const PREVIEW = 3;
                const preview = detailRows.slice(0, PREVIEW);
                const hiddenCount =
                  detailRows.length -
                  PREVIEW +
                  (request.special_requirements ? 1 : 0);
                return (
                  <>
                    <View style={styles.detailGrid}>
                      {preview.map((d, i) => (
                        <View key={i} style={styles.detailGridItem}>
                          <Text style={styles.detailGridLabel}>{d.label}</Text>
                          <Text style={styles.detailGridValue}>{d.value}</Text>
                        </View>
                      ))}
                      {hiddenCount > 0 && (
                        <View style={styles.detailGridItem}>
                          <Text style={styles.detailGridMoreLabel}>
                            +{hiddenCount} {t("moreDetails")}
                          </Text>
                        </View>
                      )}
                    </View>
                  </>
                );
              })()}

            {/* Availability schedule */}
            {availability && <SchedulePicker value={availability} readOnly />}

            {/* Posted date */}
            <View style={styles.detailRow}>
              <Feather name="clock" size={16} color={theme.secondaryText} />
              <Text style={styles.posted}>
                {t("posted")}{" "}
                {new Date(request.created_at).toLocaleDateString()}
              </Text>
            </View>
          </ScrollView>

          {/* View full details — pinned at bottom of card */}
          <Pressable
            style={styles.viewDetailsBtn}
            onPress={() =>
              router.push({
                pathname: "/request/[id]",
                params: { id: request.id },
              } as any)
            }
          >
            <Text style={styles.viewDetailsBtnText}>{t("showDetails")}</Text>
            <Feather name="arrow-right" size={14} color={theme.primary} />
          </Pressable>

          {/* Swipe indicators */}
          <Animated.View
            style={[styles.indicatorLeft, { opacity: leftOpacity }]}
          >
            <Text style={styles.indicatorText}>{t("skip")}</Text>
          </Animated.View>
          <Animated.View
            style={[styles.indicatorRight, { opacity: rightOpacity }]}
          >
            <Text style={styles.indicatorText}>{t("interestedBtn")}</Text>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Fullscreen image viewer */}
      <ImageViewer
        images={photos}
        visible={viewerVisible}
        initialIndex={viewerIndex}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
}
