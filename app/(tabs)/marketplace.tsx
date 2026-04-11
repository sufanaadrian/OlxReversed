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
  status: "active" | "closed";
  created_at: string;
  location: string | null;
  open_budget: boolean | null;
  posting_as: string | null;
  budget_type: string | null;
  timeline: string | null;
  duration: string | null;
  workers_needed: number | null;
  work_mode: string | null;
  experience_level: string | null;
  photos: string[] | null;
  profiles?: { email: string | null } | null;
};

const timelineKeys: Record<string, string> = {
  asap: "timelineAsap",
  specific_date: "timelineDate",
  flexible: "timelineFlexible",
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

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = Math.min(120, width * 0.28);

export default function MarketplaceScreen() {
  const t = useTranslation();

  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

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
    duration,
    workers_needed,
    work_mode,
    experience_level,
    photos,
    profiles!requests_user_id_fkey (
      email
    )
  `,
      )
      .eq("status", "active")
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

    setRequests((data ?? []) as any);
    setCurrentIndex(0);
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
}: {
  request: RequestRow;
  remaining: number;
  total: number;
  onSwipe: (direction: "left" | "right") => void;
  t: (key: string) => string;
}) {
  const { formatPrice } = useCurrency();
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

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
      onMoveShouldSetPanResponder: (_evt, g) => Math.abs(g.dx) > 6,
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

  const email = request.profiles?.email ?? "unknown";

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
          <View style={styles.cardContent}>
            {request.photos && request.photos.length > 0 && (
              <Image
                source={{ uri: request.photos[0] }}
                style={styles.cardPhoto}
                resizeMode="cover"
              />
            )}

            <View style={styles.badgeRow}>
              {request.posting_as === "offering" && (
                <View style={[styles.badge, { backgroundColor: "#DCFCE7" }]}>
                  <Text style={[styles.badgeText, { color: "#166534" }]}>
                    {t("postingOffering")}
                  </Text>
                </View>
              )}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {t(categoryTranslationKeys[request.category] || "other")}
                </Text>
              </View>
              {request.timeline && timelineKeys[request.timeline] && (
                <View style={styles.badgeOutline}>
                  <Text style={styles.badgeOutlineText}>
                    {t(timelineKeys[request.timeline])}
                  </Text>
                </View>
              )}
              {request.duration && durationKeys[request.duration] && (
                <View style={styles.badgeOutline}>
                  <Text style={styles.badgeOutlineText}>
                    {t(durationKeys[request.duration])}
                  </Text>
                </View>
              )}
              {(request.workers_needed ?? 1) > 1 && (
                <View style={styles.badgeOutline}>
                  <Text style={styles.badgeOutlineText}>
                    {request.workers_needed} {t("workersNeeded")}
                  </Text>
                </View>
              )}
              {request.work_mode && workModeKeys[request.work_mode] && (
                <View style={styles.badgeOutline}>
                  <Text style={styles.badgeOutlineText}>
                    {t(workModeKeys[request.work_mode])}
                  </Text>
                </View>
              )}
              {request.experience_level &&
                request.experience_level !== "any" &&
                experienceKeys[request.experience_level] && (
                  <View style={styles.badgeOutline}>
                    <Text style={styles.badgeOutlineText}>
                      {t(experienceKeys[request.experience_level])}
                    </Text>
                  </View>
                )}
            </View>

            <Text style={styles.title}>{request.title}</Text>

            <Text style={styles.postedBy}>
              {t("postedBy")} {email}
            </Text>

            <Text style={styles.desc}>{request.description}</Text>

            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Feather
                  name="dollar-sign"
                  size={16}
                  color={theme.secondaryText}
                />
                <Text style={styles.detailText}>
                  {request.open_budget
                    ? t("openBudget")
                    : request.budget_type &&
                        request.budget_type !== "range" &&
                        budgetTypeKeys[request.budget_type]
                      ? `${formatPrice(request.budget_min)} ${t(budgetTypeKeys[request.budget_type])}`
                      : `${formatPrice(request.budget_min)} \u2013 ${formatPrice(request.budget_max)}`}
                </Text>
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

              <Text style={styles.posted}>
                {t("posted")}{" "}
                {new Date(request.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

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
    </View>
  );
}
