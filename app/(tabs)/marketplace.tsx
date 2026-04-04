import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { Alert } from "react-native"; // add at top if missing

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCurrency } from "../../src/context/CurrencyContext";
import { useTranslation } from "../../src/context/LanguageContext";
import { useApp } from "../../src/context/useApp";
import { supabase } from "../../src/lib/supabase";

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
  profiles?: { email: string | null } | null; // ✅ joined from profiles
};

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = Math.min(120, width * 0.28);

export default function MarketplaceScreen() {
  const t = useTranslation();
  // keep your app-context action for now
  const { addInterestedRequest } = useApp();

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
  }, []);

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
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {t(categoryTranslationKeys[request.category] || "other")}
              </Text>
            </View>

            <Text style={styles.title}>{request.title}</Text>

            {/* ✅ Posted by email */}
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
                  {formatPrice(request.budget_min)} –{" "}
                  {formatPrice(request.budget_max)}
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
            <Text style={styles.indicatorText}>{t("interested")}</Text>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

const theme = {
  primary: "#1E40AF",
  success: "#16A34A",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
  accentSoft: "#DBEAFE",
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },

  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBox: {
    flex: 1,
    height: 44,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, color: theme.primaryText, fontSize: 15 },
  iconBtn: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },

  chipsRow: { paddingTop: 12, paddingBottom: 2, gap: 8, paddingRight: 16 },
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
  chipText: { color: theme.secondaryText, fontSize: 13 },
  chipTextSelected: { color: theme.primaryText, fontWeight: "700" },

  swipeArea: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  emptyState: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: theme.primaryText },
  emptySubtitle: {
    fontSize: 14,
    color: theme.secondaryText,
    textAlign: "center",
  },
  refreshBtn: {
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bg,
  },
  refreshBtnText: { fontWeight: "900", color: theme.primaryText },

  cardWrap: { flex: 1 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  progressPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  progressPillText: {
    fontSize: 12,
    color: theme.secondaryText,
    fontWeight: "700",
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: theme.border,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: theme.primary },

  stack: { flex: 1, alignItems: "center", justifyContent: "center" },
  stackBg1: {
    position: "absolute",
    width: "96%",
    height: "86%",
    backgroundColor: theme.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    transform: [{ translateY: 14 }, { scale: 0.98 }],
  },
  stackBg2: {
    position: "absolute",
    width: "92%",
    height: "82%",
    backgroundColor: theme.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    transform: [{ translateY: 26 }, { scale: 0.96 }],
  },
  card: {
    width: "100%",
    height: "88%",
    backgroundColor: theme.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: "hidden",
  },
  cardContent: { flex: 1, padding: 16 },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: theme.accentSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  badgeText: { fontSize: 12, color: theme.primaryText, fontWeight: "700" },

  title: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.primaryText,
    marginBottom: 4,
  },

  postedBy: {
    fontSize: 12,
    color: theme.secondaryText,
    marginBottom: 10,
    fontWeight: "700",
  },

  desc: {
    fontSize: 14,
    color: theme.secondaryText,
    lineHeight: 20,
    marginBottom: 14,
  },

  details: { marginTop: "auto", gap: 10 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 14, color: theme.primaryText },
  posted: { fontSize: 12, color: theme.secondaryText, marginTop: 2 },

  indicatorLeft: {
    position: "absolute",
    top: 18,
    left: 18,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: theme.border,
  },
  indicatorRight: {
    position: "absolute",
    top: 18,
    right: 18,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: theme.accentSoft,
  },
  indicatorText: { fontSize: 12, fontWeight: "900", color: theme.primaryText },

  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 10,
  },
  actionBtn: {
    height: 54,
    width: 54,
    borderRadius: 18,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
