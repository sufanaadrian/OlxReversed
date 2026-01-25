import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { supabase } from "../../src/lib/supabase";

type Filter = "all" | "active" | "matched" | "closed";

function getStatusLabel(status: "active" | "matched" | "closed") {
  switch (status) {
    case "active":
      return "OPEN";
    case "matched":
      return "NEGOTIATING";
    case "closed":
      return "CLOSED";
  }
}

type RequestRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  location: string | null;
  status: "active" | "matched" | "closed";
  created_at: string;
};

// ✅ UPDATED: include withdrawn
type OfferMini = {
  id: string;
  request_id: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
};

// ✅ UPDATED: include withdrawn
type OfferCounts = {
  total: number;
  pending: number;
  accepted: number;
  withdrawn: number;
};

type CounterOfferMini = {
  id: string;
  request_id: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
};

type CounterCounts = { pending: number; accepted: number };

export default function MyRequestsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [countsByRequestId, setCountsByRequestId] = useState<
    Map<string, OfferCounts>
  >(new Map());
  const [counterCountsByRequestId, setCounterCountsByRequestId] = useState<
    Map<string, CounterCounts>
  >(new Map());
  const [filter, setFilter] = useState<Filter>("all");

  const openRowRef = useRef<Swipeable | null>(null);

  const load = useCallback(async (showSpinner: boolean = true) => {
    if (showSpinner) setLoading(true);

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;

    if (!user) {
      setRequests([]);
      setCountsByRequestId(new Map());
      setCounterCountsByRequestId(new Map());
      if (showSpinner) setLoading(false);
      return;
    }

    const { data: reqs, error: reqErr } = await supabase
      .from("requests")
      .select(
        "id,user_id,title,description,category,budget_min,budget_max,location,status,created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (reqErr) {
      Alert.alert("Error", reqErr.message);
      setRequests([]);
      setCountsByRequestId(new Map());
      setCounterCountsByRequestId(new Map());
      if (showSpinner) setLoading(false);
      return;
    }

    const reqList = (reqs ?? []) as RequestRow[];
    setRequests(reqList);

    if (reqList.length === 0) {
      setCountsByRequestId(new Map());
      setCounterCountsByRequestId(new Map());
      if (showSpinner) setLoading(false);
      return;
    }

    const ids = reqList.map((r) => r.id);

    // Offers counts (includes withdrawn)
    const { data: offers, error: offErr } = await supabase
      .from("offers")
      .select("id,request_id,status")
      .in("request_id", ids);

    if (offErr) {
      setCountsByRequestId(new Map());
      setCounterCountsByRequestId(new Map());
      if (showSpinner) setLoading(false);
      return;
    }

    const offerMap = new Map<string, OfferCounts>();
    (offers ?? []).forEach((o: any) => {
      const row = o as OfferMini;
      const prev = offerMap.get(row.request_id) ?? {
        total: 0,
        pending: 0,
        accepted: 0,
        withdrawn: 0,
      };

      offerMap.set(row.request_id, {
        total: prev.total + 1,
        pending: prev.pending + (row.status === "pending" ? 1 : 0),
        accepted: prev.accepted + (row.status === "accepted" ? 1 : 0),
        withdrawn: prev.withdrawn + (row.status === "withdrawn" ? 1 : 0),
      });
    });
    setCountsByRequestId(offerMap);

    // Counter offers counts
    const { data: counters, error: coErr } = await supabase
      .from("counter_offers")
      .select("id,request_id,status")
      .in("request_id", ids);

    if (coErr) {
      setCounterCountsByRequestId(new Map());
      if (showSpinner) setLoading(false);
      return;
    }

    const counterMap = new Map<string, CounterCounts>();
    (counters ?? []).forEach((c: any) => {
      const row = c as CounterOfferMini;
      const prev = counterMap.get(row.request_id) ?? {
        pending: 0,
        accepted: 0,
      };
      counterMap.set(row.request_id, {
        pending: prev.pending + (row.status === "pending" ? 1 : 0),
        accepted: prev.accepted + (row.status === "accepted" ? 1 : 0),
      });
    });
    setCounterCountsByRequestId(counterMap);

    if (showSpinner) setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load(false);
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const counts = useMemo(() => {
    const all = requests.length;
    const active = requests.filter((r) => r.status === "active").length;
    const matched = requests.filter((r) => r.status === "matched").length;
    const closed = requests.filter((r) => r.status === "closed").length;
    return { all, active, matched, closed };
  }, [requests]);

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  const confirmDelete = (req: RequestRow) => {
    Alert.alert(
      "Delete request?",
      "This will permanently delete your request (and its offers).",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteRequest(req),
        },
      ],
    );
  };

  const deleteRequest = async (req: RequestRow) => {
    openRowRef.current?.close();

    const prevRequests = requests;
    const prevCounts = countsByRequestId;
    const prevCounterCounts = counterCountsByRequestId;

    setRequests((cur) => cur.filter((r) => r.id !== req.id));

    setCountsByRequestId((cur) => {
      const next = new Map(cur);
      next.delete(req.id);
      return next;
    });
    setCounterCountsByRequestId((cur) => {
      const next = new Map(cur);
      next.delete(req.id);
      return next;
    });

    const { error } = await supabase.from("requests").delete().eq("id", req.id);

    if (error) {
      setRequests(prevRequests);
      setCountsByRequestId(prevCounts);
      setCounterCountsByRequestId(prevCounterCounts);
      Alert.alert("Error", error.message);
      return;
    }
  };

  const renderRightActions = (req: RequestRow) => {
    return (
      <View style={styles.rightActionsWrap}>
        <Pressable
          onPress={() => confirmDelete(req)}
          style={({ pressed }) => [
            styles.deleteBtn,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Feather name="trash-2" size={18} color="white" />
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    );
  };

  const renderItem = ({ item }: { item: RequestRow }) => {
    const offerCounts = countsByRequestId.get(item.id) ?? {
      total: 0,
      pending: 0,
      accepted: 0,
      withdrawn: 0,
    };

    const counterCounts = counterCountsByRequestId.get(item.id) ?? {
      pending: 0,
      accepted: 0,
    };

    const hasAcceptedDeal =
      offerCounts.accepted > 0 || counterCounts.accepted > 0;
    const hasPendingCounters = counterCounts.pending > 0;
    const hasWithdrawnOffers = offerCounts.withdrawn > 0;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
        onSwipeableWillOpen={() => {
          if (openRowRef.current) openRowRef.current.close();
        }}
        onSwipeableOpen={(direction, swipeable) => {
          // ✅ FIX: store the opened row so only one stays open
          openRowRef.current = swipeable;
        }}
      >
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/request/[id]/offers",
              params: { id: item.id },
            } as any)
          }
          style={styles.card}
        >
          <View style={styles.topRow}>
            <Text style={styles.categoryPill}>{item.category}</Text>

            <View style={styles.rightBadges}>
              {offerCounts.total > 0 && (
                <View style={styles.offerPill}>
                  <Text style={styles.offerPillText}>
                    {offerCounts.total} offer
                    {offerCounts.total === 1 ? "" : "s"}
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.statusPill,
                  item.status === "active"
                    ? styles.statusOpen
                    : item.status === "matched"
                      ? styles.statusNegotiating
                      : styles.statusClosed,
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaStrong}>
              ${item.budget_min.toLocaleString()} – $
              {item.budget_max.toLocaleString()}
            </Text>
            {!!item.location && (
              <Text style={styles.metaMuted}>• {item.location}</Text>
            )}
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.smallMuted}>
              Posted at {new Date(item.created_at).toLocaleString()}
            </Text>

            {hasAcceptedDeal ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  router.push({
                    pathname: "/request/[id]/chat",
                    params: { id: item.id },
                  } as any);
                }}
                style={styles.reviewBtn}
              >
                <Text style={styles.reviewBtnText}>Chat</Text>
              </Pressable>
            ) : offerCounts.pending > 0 ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  router.push({
                    pathname: "/request/offers",
                    params: { id: item.id },
                  } as any);
                }}
                style={styles.reviewBtn}
              >
                <Text style={styles.reviewBtnText}>
                  Review ({offerCounts.pending})
                </Text>
              </Pressable>
            ) : hasPendingCounters ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  router.push({
                    pathname: "/request/offers",
                    params: { id: item.id },
                  } as any);
                }}
                style={styles.viewBtn}
              >
                <Text style={styles.viewBtnText}>
                  Counter pending ({counterCounts.pending})
                </Text>
              </Pressable>
            ) : hasWithdrawnOffers ? (
              <Text style={styles.smallMuted}>
                Withdrawn ({offerCounts.withdrawn})
              </Text>
            ) : (
              <Text style={styles.smallMuted}>
                {offerCounts.total === 0
                  ? "No offers yet"
                  : "No pending offers"}
              </Text>
            )}
          </View>
        </Pressable>
      </Swipeable>
    );
  };

  const ListEmpty = (
    <View style={styles.centerCard}>
      <Text style={styles.titleEmpty}>Nothing here</Text>
      <Text style={styles.muted}>Create a request to see it here.</Text>
    </View>
  );

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>My Requests</Text>

        <Pressable
          onPress={() => router.push("/create-request")}
          style={styles.createBtn}
        >
          <Feather name="plus" size={18} color="white" />
        </Pressable>
      </View>

      <View style={styles.filtersWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          <FilterBtn
            label={`All (${counts.all})`}
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />

          <FilterBtn
            label={`Open (${counts.active})`}
            active={filter === "active"}
            onPress={() => setFilter("active")}
          />

          <FilterBtn
            label={`Negotiating (${counts.matched})`}
            active={filter === "matched"}
            onPress={() => setFilter("matched")}
          />

          <FilterBtn
            label={`Closed (${counts.closed})`}
            active={filter === "closed"}
            onPress={() => setFilter("closed")}
          />
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerCard}>
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            filtered.length === 0 ? { flexGrow: 1 } : null,
          ]}
          ListEmptyComponent={ListEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

function FilterBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterBtn, active && styles.filterBtnActive]}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </Pressable>
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
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: theme.bg,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  header: { fontSize: 20, fontWeight: "900", color: theme.primaryText },

  createBtn: {
    height: 40,
    width: 40,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  filtersWrap: { alignItems: "center", marginBottom: 6 },
  filters: {
    flexDirection: "row",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 6,
    gap: 6,
  },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 },
  filterBtnActive: { backgroundColor: theme.accentSoft },
  filterText: { fontWeight: "800", color: theme.secondaryText, fontSize: 12 },
  filterTextActive: { color: theme.primaryText },

  listContent: { paddingBottom: 18 },

  centerCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  titleEmpty: { fontSize: 16, fontWeight: "900", color: theme.primaryText },
  muted: { color: theme.secondaryText, textAlign: "center" },

  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rightBadges: { flexDirection: "row", gap: 8, alignItems: "center" },

  categoryPill: {
    alignSelf: "flex-start",
    backgroundColor: theme.accentSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontWeight: "900",
    color: theme.primaryText,
  },

  offerPill: {
    backgroundColor: theme.accentSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  offerPillText: { fontSize: 12, fontWeight: "900", color: theme.primary },

  // ✅ NEW withdrawn badge styles
  withdrawnPill: {
    backgroundColor: theme.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  withdrawnPillText: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.primaryText,
  },

  dealPill: {
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dealPillText: { fontSize: 12, fontWeight: "900", color: "#166534" },

  statusPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statusActive: {
    backgroundColor: theme.accentSoft,
    borderColor: theme.primary,
  },
  statusMatched: { backgroundColor: "#FEF9C3", borderColor: "#F59E0B" },
  statusClosed: { backgroundColor: theme.border, borderColor: theme.border },
  statusText: { fontSize: 12, fontWeight: "900", color: theme.primaryText },
  statusOpen: {
    backgroundColor: "#2f855a", // or whatever you use for "active"
  },
  statusNegotiating: {
    backgroundColor: "#805ad5", // pick any color you like
  },

  title: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "900",
    color: theme.primaryText,
  },
  desc: { marginTop: 6, color: theme.secondaryText, lineHeight: 18 },

  metaRow: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metaStrong: { fontWeight: "900", color: theme.primaryText },
  metaMuted: { color: theme.secondaryText },

  footerRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallMuted: { fontSize: 12, color: theme.secondaryText },

  reviewBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewBtnText: { color: "white", fontWeight: "900", fontSize: 12 },

  viewBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  viewBtnText: { color: theme.primaryText, fontWeight: "900", fontSize: 12 },

  rightActionsWrap: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginTop: 12,
  },
  deleteBtn: {
    width: 92,
    height: "100%",
    borderRadius: 18,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  deleteText: { color: "white", fontWeight: "900", fontSize: 12 },
});
