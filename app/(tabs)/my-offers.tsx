import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Screen } from "../../src/components/Screen";
import { supabase } from "../../src/lib/supabase";

type SwipeDir = "left" | "right";
type Filter = "all" | "right" | "left";

type SwipeRowFromDb = {
  user_id: string;
  request_id: string;
  direction: SwipeDir;
  created_at: string;

  // Supabase join often comes as an array
  requests: {
    id: string;
    title: string;
    description: string;
    category: string;
    budget_min: number;
    budget_max: number;
    location: string | null;
    created_at: string;
  }[];
};

type NormalizedRow = {
  user_id: string;
  request_id: string;
  direction: SwipeDir;
  created_at: string;
  request: SwipeRowFromDb["requests"][number];
};

export default function MyOffersScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [rows, setRows] = useState<SwipeRowFromDb[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;

    setEmail(user?.email ?? null);
    setUserId(user?.id ?? null);

    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }

    // 1) fetch swipes
    const { data: swipes, error: swipesErr } = await supabase
      .from("request_swipes")
      .select("user_id, request_id, direction, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (swipesErr) {
      setRows([]);
      setLoading(false);
      return;
    }

    const swipeList = (swipes ?? []) as {
      user_id: string;
      request_id: string;
      direction: "left" | "right";
      created_at: string;
    }[];

    if (swipeList.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const requestIds = swipeList.map((s) => s.request_id);

    // 2) fetch requests referenced by swipes
    const { data: reqs, error: reqErr } = await supabase
      .from("requests")
      .select(
        "id,title,description,category,budget_min,budget_max,location,created_at",
      )
      .in("id", requestIds);

    if (reqErr) {
      // if this errors, it's almost certainly RLS on requests
      setRows([]);
      setLoading(false);
      return;
    }

    const reqMap = new Map((reqs ?? []).map((r: any) => [r.id, r]));

    // 3) rebuild rows in the shape your UI expects (requests as array)
    const merged = swipeList.map((s) => ({
      ...s,
      requests: reqMap.get(s.request_id) ? [reqMap.get(s.request_id)] : [],
    }));

    setRows(merged as any);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const normalizedRows: NormalizedRow[] = useMemo(() => {
    return rows
      .map((r) => {
        const req = r.requests?.[0];
        if (!req) return null;
        return {
          user_id: r.user_id,
          request_id: r.request_id,
          direction: r.direction,
          created_at: r.created_at,
          request: req,
        };
      })
      .filter(Boolean) as NormalizedRow[];
  }, [rows]);

  const counts = useMemo(() => {
    const all = normalizedRows.length;
    const interested = normalizedRows.filter(
      (r) => r.direction === "right",
    ).length;
    const skipped = normalizedRows.filter((r) => r.direction === "left").length;
    return { all, interested, skipped };
  }, [normalizedRows]);

  const displayRows = useMemo(() => {
    if (filter === "all") return normalizedRows;
    return normalizedRows.filter((r) => r.direction === filter);
  }, [normalizedRows, filter]);

  const goSignIn = () => {
    router.push({
      pathname: "/sign-in",
      params: { redirect: "/(tabs)/my-offers" },
    } as any);
  };

  const removeSwipe = (requestId: string) => {
    if (!userId) return;

    Alert.alert(
      "Remove",
      "Remove this item from My Offers? It will appear again in Marketplace.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            // optimistic
            setRows((prev) => prev.filter((r) => r.request_id !== requestId));

            const { error } = await supabase
              .from("request_swipes")
              .delete()
              .eq("user_id", userId)
              .eq("request_id", requestId);

            if (error) {
              await load(); // rollback
              Alert.alert("Could not remove", error.message);
            }
          },
        },
      ],
    );
  };

  const filterLabel =
    filter === "all"
      ? "items"
      : filter === "right"
        ? "interested items"
        : "skipped items";

  return (
    <Screen>
      <View style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>My Offers</Text>

          {/* Centered 3-button filter row */}
          <View style={styles.filtersWrap}>
            <View style={styles.filtersBar}>
              <Pressable
                onPress={() => setFilter("all")}
                style={[
                  styles.filterBtn,
                  filter === "all" && styles.filterBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === "all" && styles.filterTextActive,
                  ]}
                >
                  All
                </Text>
                <Text
                  style={[
                    styles.countPill,
                    filter === "all" && styles.countPillActive,
                  ]}
                >
                  {counts.all}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setFilter("right")}
                style={[
                  styles.filterBtn,
                  filter === "right" && styles.filterBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === "right" && styles.filterTextActive,
                  ]}
                >
                  Interested
                </Text>
                <Text
                  style={[
                    styles.countPill,
                    filter === "right" && styles.countPillActive,
                  ]}
                >
                  {counts.interested}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setFilter("left")}
                style={[
                  styles.filterBtn,
                  filter === "left" && styles.filterBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === "left" && styles.filterTextActive,
                  ]}
                >
                  Skipped
                </Text>
                <Text
                  style={[
                    styles.countPill,
                    filter === "left" && styles.countPillActive,
                  ]}
                >
                  {counts.skipped}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          {!email ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Feather name="lock" size={22} color={theme.primaryText} />
              </View>
              <Text style={styles.emptyTitle}>Sign in to save offers</Text>
              <Text style={styles.emptyText}>
                You can browse Marketplace without an account, but to save /
                remove items here you need to sign in.
              </Text>

              <Pressable style={styles.primaryBtn} onPress={goSignIn}>
                <Text style={styles.primaryBtnText}>Sign in</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Loading…</Text>
              <Text style={styles.emptyText}>Fetching your items</Text>
            </View>
          ) : displayRows.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIcon,
                  filter === "right" ? styles.iconSoft : styles.iconMuted,
                ]}
              >
                <Feather
                  name={
                    filter === "right"
                      ? "check"
                      : filter === "left"
                        ? "x"
                        : "inbox"
                  }
                  size={22}
                  color={theme.primaryText}
                />
              </View>
              <Text style={styles.emptyTitle}>No {filterLabel}</Text>
              <Text style={styles.emptyText}>
                {filter === "all"
                  ? "Swipe in Marketplace to start building your list."
                  : filter === "right"
                    ? "Swipe right in Marketplace to save requests here."
                    : "Swipe left in Marketplace to keep skipped items here."}
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 18 }}>
              {displayRows.map((r) => {
                const req = r.request;
                const isInterested = r.direction === "right";

                return (
                  <View key={`${req.id}-${r.created_at}`} style={styles.card}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/request/[id]",
                          params: { id: req.id },
                        } as any)
                      }
                    >
                      <View style={styles.cardTop}>
                        <Text style={styles.badge}>{req.category}</Text>
                        <Text
                          style={[
                            styles.statusPill,
                            isInterested ? styles.statusOk : styles.statusNo,
                          ]}
                        >
                          {isInterested ? "interested" : "skipped"}
                        </Text>
                      </View>

                      <Text style={styles.cardTitle}>{req.title}</Text>
                      <Text style={styles.cardDesc} numberOfLines={3}>
                        {req.description}
                      </Text>

                      <View style={styles.metaRow}>
                        <Text style={styles.metaText}>
                          ${req.budget_min.toLocaleString()} – $
                          {req.budget_max.toLocaleString()}
                        </Text>
                        {!!req.location && (
                          <Text style={styles.metaSub}>• {req.location}</Text>
                        )}
                      </View>

                      <Text style={styles.dateText}>
                        Saved {new Date(r.created_at).toLocaleDateString()}
                      </Text>
                    </Pressable>

                    <View style={styles.cardActions}>
                      <Pressable
                        onPress={() => removeSwipe(req.id)}
                        style={({ pressed }) => [
                          styles.removeBtn,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Feather
                          name="trash-2"
                          size={16}
                          color={theme.primaryText}
                        />
                        <Text style={styles.removeText}>Remove</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Screen>
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
  page: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  header: { gap: 10, marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "900", color: theme.primaryText },

  // Center the whole filters control
  filtersWrap: { alignItems: "center" },
  // 3 equal buttons; centered; looks like a segmented control
  filtersBar: {
    width: "100%",
    maxWidth: 520,
    flexDirection: "row",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    overflow: "hidden",
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  filterBtnActive: { backgroundColor: theme.accentSoft },

  filterText: { fontWeight: "900", color: theme.secondaryText, fontSize: 12 },
  filterTextActive: { color: theme.primaryText },

  countPill: {
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: theme.border,
    color: theme.secondaryText,
    textAlign: "center",
    fontWeight: "900",
    fontSize: 11,
  },
  countPillActive: {
    backgroundColor: theme.primary,
    color: "white",
  },

  emptyState: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyIcon: {
    height: 44,
    width: 44,
    borderRadius: 16,
    backgroundColor: theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSoft: { backgroundColor: theme.accentSoft },
  iconMuted: { backgroundColor: theme.border },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.primaryText,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    color: theme.secondaryText,
    textAlign: "center",
    lineHeight: 18,
  },

  primaryBtn: {
    marginTop: 4,
    height: 46,
    borderRadius: 16,
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "white", fontWeight: "900" },

  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: theme.accentSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontWeight: "900",
    color: theme.primaryText,
  },
  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontWeight: "900",
    textTransform: "uppercase",
    fontSize: 11,
  },
  statusOk: { backgroundColor: theme.accentSoft, color: theme.primaryText },
  statusNo: { backgroundColor: theme.border, color: theme.secondaryText },

  cardTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "900",
    color: theme.primaryText,
  },
  cardDesc: { marginTop: 6, color: theme.secondaryText, lineHeight: 18 },

  metaRow: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metaText: { fontWeight: "900", color: theme.primaryText },
  metaSub: { color: theme.secondaryText },

  dateText: { marginTop: 10, fontSize: 12, color: theme.secondaryText },

  cardActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bg,
  },
  removeText: { fontWeight: "900", color: theme.primaryText, fontSize: 13 },
});
