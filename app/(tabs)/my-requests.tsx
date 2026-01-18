import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../src/lib/supabase";

type Filter = "all" | "active" | "closed";

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

type OfferMini = {
  id: string;
  request_id: string;
  status: "pending" | "accepted" | "rejected";
};

type OfferCounts = { total: number; pending: number };

export default function MyRequestsScreen() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [countsByRequestId, setCountsByRequestId] = useState<
    Map<string, OfferCounts>
  >(new Map());
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    setLoading(true);

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;

    if (!user) {
      setRequests([]);
      setCountsByRequestId(new Map());
      setLoading(false);
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
      setLoading(false);
      return;
    }

    const reqList = (reqs ?? []) as RequestRow[];
    setRequests(reqList);

    if (reqList.length === 0) {
      setCountsByRequestId(new Map());
      setLoading(false);
      return;
    }

    const ids = reqList.map((r) => r.id);

    const { data: offers, error: offErr } = await supabase
      .from("offers")
      .select("id,request_id,status")
      .in("request_id", ids);

    if (offErr) {
      setCountsByRequestId(new Map());
      setLoading(false);
      return;
    }

    const map = new Map<string, OfferCounts>();
    (offers ?? []).forEach((o: any) => {
      const row = o as OfferMini;
      const prev = map.get(row.request_id) ?? { total: 0, pending: 0 };
      map.set(row.request_id, {
        total: prev.total + 1,
        pending: prev.pending + (row.status === "pending" ? 1 : 0),
      });
    });

    setCountsByRequestId(map);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const counts = useMemo(() => {
    const all = requests.length;
    const active = requests.filter((r) => r.status !== "closed").length; // active + matched
    const closed = requests.filter((r) => r.status === "closed").length;
    return { all, active, closed };
  }, [requests]);

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    if (filter === "closed")
      return requests.filter((r) => r.status === "closed");
    return requests.filter((r) => r.status !== "closed"); // active + matched
  }, [requests, filter]);

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

      {/* Filters */}
      <View style={styles.filtersWrap}>
        <View style={styles.filters}>
          <FilterBtn
            label={`All (${counts.all})`}
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />
          <FilterBtn
            label={`Active (${counts.active})`}
            active={filter === "active"}
            onPress={() => setFilter("active")}
          />
          <FilterBtn
            label={`Closed (${counts.closed})`}
            active={filter === "closed"}
            onPress={() => setFilter("closed")}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerCard}>
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerCard}>
          <Text style={styles.titleEmpty}>Nothing here</Text>
          <Text style={styles.muted}>Create a request to see it here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 18 }}>
          {filtered.map((r) => {
            const offerCounts = countsByRequestId.get(r.id) ?? {
              total: 0,
              pending: 0,
            };

            return (
              <Pressable
                key={r.id}
                onPress={() =>
                  router.push({
                    pathname: "/request/[id]",
                    params: { id: r.id },
                  } as any)
                }
                style={styles.card}
              >
                <View style={styles.topRow}>
                  <Text style={styles.categoryPill}>{r.category}</Text>

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
                        r.status === "active"
                          ? styles.statusActive
                          : r.status === "matched"
                            ? styles.statusMatched
                            : styles.statusClosed,
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {r.status === "matched"
                          ? "MATCHED"
                          : r.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.title}>{r.title}</Text>
                <Text style={styles.desc} numberOfLines={2}>
                  {r.description}
                </Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaStrong}>
                    ${r.budget_min.toLocaleString()} – $
                    {r.budget_max.toLocaleString()}
                  </Text>
                  {!!r.location && (
                    <Text style={styles.metaMuted}>• {r.location}</Text>
                  )}
                </View>

                <View style={styles.footerRow}>
                  <Text style={styles.smallMuted}>
                    Posted {new Date(r.created_at).toLocaleDateString()}
                  </Text>

                  {offerCounts.pending > 0 ? (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push({
                          pathname: "/request/offers",
                          params: { id: r.id },
                        } as any);
                      }}
                      style={styles.reviewBtn}
                    >
                      <Text style={styles.reviewBtnText}>
                        Review ({offerCounts.pending})
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.smallMuted}>
                      {offerCounts.total === 0
                        ? "No offers yet"
                        : "No pending offers"}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
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

  filtersWrap: { alignItems: "center", marginBottom: 12 },
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
});
