import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
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
import { Screen } from "../../src/components/Screen";
import type { Request } from "../../src/context/AppContext";
import { supabase } from "../../src/lib/supabase";

import { useApp } from "../../src/context/useApp";

const categories = [
  "All",
  "Vehicles",
  "Real Estate",
  "Services",
  "Electronics & Tech",
  "Fashion & Personal",
  "Other",
];

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = Math.min(120, width * 0.28);

export default function Marketplace() {
  const { requests, addInterestedRequest } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentIndex, setCurrentIndex] = useState(0);

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
    setCurrentIndex((prev) =>
      Math.min(prev + 1, Math.max(filteredRequests.length - 1, 0)),
    );
  };

  const handleSwipe = async (direction: "left" | "right") => {
    if (!currentRequest) return;

    if (direction === "right") {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.push("/sign-in");
        return;
      }

      addInterestedRequest(currentRequest);
    }

    goNext();
  };

  return (
    <Screen>
      <View style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.h1}>Marketplace</Text>

          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Feather name="search" size={18} color={theme.secondaryText} />
              <TextInput
                value={searchQuery}
                onChangeText={(t) => {
                  setSearchQuery(t);
                  setCurrentIndex(0);
                }}
                placeholder="Search requests"
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
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Swipe Area */}
        <View style={styles.swipeArea}>
          {currentIndex >= filteredRequests.length || !currentRequest ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {requests.length === 0
                  ? "No requests loaded"
                  : "No more requests"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {requests.length === 0
                  ? "Add mock requests to AppContext to see cards here."
                  : "You've viewed all available requests in this category."}
              </Text>

              <Pressable
                style={styles.secondaryBtn}
                onPress={() => setCurrentIndex(0)}
              >
                <Text style={styles.secondaryBtnText}>Reset</Text>
              </Pressable>
            </View>
          ) : (
            <RequestCard
              request={currentRequest}
              remaining={filteredRequests.length - currentIndex}
              total={filteredRequests.length}
              onSwipe={handleSwipe}
            />
          )}
        </View>

        {/* Bottom actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => handleSwipe("left")}
          >
            <Feather name="x" size={22} color={theme.primaryText} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => handleSwipe("right")}
          >
            <Feather name="check" size={22} color={theme.primaryText} />
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

function RequestCard({
  request,
  remaining,
  total,
  onSwipe,
}: {
  request: Request;
  remaining: number;
  total: number;
  onSwipe: (direction: "left" | "right") => void;
}) {
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
        {
          useNativeDriver: false,
        },
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

  return (
    <View style={styles.cardWrap}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <View style={styles.progressPill}>
          <Text style={styles.progressPillText}>{remaining} left</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <Pressable
          style={styles.detailsBtn}
          onPress={() =>
            router.push({
              pathname: "/request/[id]",
              params: { id: request.id },
            } as any)
          }
        >
          <Feather name="chevron-right" size={18} color={theme.primaryText} />
        </Pressable>
      </View>

      {/* Stack */}
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
              <Text style={styles.badgeText}>{request.category}</Text>
            </View>

            <Text style={styles.title}>{request.title}</Text>
            <Text style={styles.desc}>{request.description}</Text>

            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Feather
                  name="dollar-sign"
                  size={16}
                  color={theme.secondaryText}
                />
                <Text style={styles.detailText}>
                  ${request.budgetMin.toLocaleString()} - $
                  {request.budgetMax.toLocaleString()}
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
                Posted {new Date(request.datePosted).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Indicators */}
          <Animated.View
            style={[styles.indicatorLeft, { opacity: leftOpacity }]}
          >
            <Text style={styles.indicatorText}>SKIP</Text>
          </Animated.View>

          <Animated.View
            style={[styles.indicatorRight, { opacity: rightOpacity }]}
          >
            <Text style={styles.indicatorText}>INTERESTED</Text>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
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
  page: { flex: 1, backgroundColor: theme.bg },

  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  h1: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.primaryText,
    marginBottom: 10,
  },

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
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.primaryText,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.secondaryText,
    textAlign: "center",
  },
  secondaryBtn: {
    marginTop: 14,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { fontWeight: "900", color: theme.primaryText },

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
  detailsBtn: {
    height: 32,
    width: 32,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },

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
    marginBottom: 8,
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
