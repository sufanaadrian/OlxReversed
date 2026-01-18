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

type SwipeDirection = "left" | "right";
type OfferStatus = "pending" | "accepted" | "rejected";

type RequestRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  location: string | null;
  created_at: string;
  status: string;
  profiles?: { email: string | null } | null;
};

type SwipeRow = {
  request_id: string;
  direction: SwipeDirection;
  created_at: string;
  requests?: RequestRow | RequestRow[] | null; // supabase relation may come back as object/array
};

type OfferRow = {
  id: string;
  request_id: string;
  user_id: string;
  status: OfferStatus;
  price: number;
  description: string;
  created_at: string;
};

type Filter = "all" | "interested" | "skipped";

export default function MyOffersScreen() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const [swipes, setSwipes] = useState<
    {
      request: RequestRow;
      direction: SwipeDirection;
      swipedAt: string;
    }[]
  >([]);

  const [offers, setOffers] = useState<OfferRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);

    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;

    if (!uid) {
      setSwipes([]);
      setOffers([]);
      setLoading(false);
      return;
    }

    // 1) Load swipes + embedded requests (explicit FK to profiles too)
    const { data: swipeData, error: swipeErr } = await supabase
      .from("request_swipes")
      .select(
        `
        request_id,
        direction,
        created_at,
        requests:requests (
          id,
          user_id,
          title,
          description,
          category,
          budget_min,
          budget_max,
          location,
          created_at,
          status,
          profiles!requests_user_id_fkey (
            email
          )
        )
      `,
      )
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (swipeErr) {
      console.log("swipeErr", swipeErr);
      Alert.alert("Error", swipeErr.message);
      setSwipes([]);
      setOffers([]);
      setLoading(false);
      return;
    }

    // Normalize: requests relation can be object or array depending on join config
    const normalizedSwipes = (swipeData ?? [])
      .map((row: any) => {
        const req = Array.isArray(row.requests)
          ? row.requests[0]
          : row.requests;

        if (!req) return null;

        return {
          request: req as RequestRow,
          direction: row.direction as SwipeDirection,
          swipedAt: row.created_at as string,
        };
      })
      .filter(Boolean) as {
      request: RequestRow;
      direction: SwipeDirection;
      swipedAt: string;
    }[];
    [];
    setSwipes(normalizedSwipes);

    // 2) Load ALL offers made by this user (we will pick latest per request_id)
    const { data: offerData, error: offerErr } = await supabase
      .from("offers")
      .select("id,request_id,user_id,status,price,description,created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (offerErr) {
      console.log("offerErr", offerErr);
      Alert.alert("Error", offerErr.message);
      setOffers([]);
      setLoading(false);
      return;
    }

    setOffers((offerData ?? []) as OfferRow[]);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Latest offer per request_id (because ordered DESC, first seen is latest)
  const latestOfferByRequestId = useMemo(() => {
    const map = new Map<string, OfferRow>();
    for (const o of offers) {
      if (!map.has(o.request_id)) map.set(o.request_id, o);
    }
    return map;
  }, [offers]);

  const counts = useMemo(() => {
    const all = swipes.length;
    const interested = swipes.filter((s) => s.direction === "right").length;
    const skipped = swipes.filter((s) => s.direction === "left").length;
    return { all, interested, skipped };
  }, [swipes]);

  const visible = useMemo(() => {
    if (filter === "all") return swipes;
    if (filter === "interested")
      return swipes.filter((s) => s.direction === "right");
    return swipes.filter((s) => s.direction === "left");
  }, [swipes, filter]);

  const openCreateOffer = (requestId: string) => {
    // Adjust this path if your modal route is different
    router.push({
      pathname: "/(modals)/create-offer",
      params: { requestId },
    } as any);
  };

  const removeSwipe = async (requestId: string) => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) return;

    // Remove swipe record -> request can reappear in marketplace
    const { error } = await supabase
      .from("request_swipes")
      .delete()
      .eq("user_id", uid)
      .eq("request_id", requestId);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    // reload
    load();
  };

  const chatSoon = () => {
    Alert.alert("Soon", "Chat functionality will be added soon");
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.h1}>My Offers</Text>
        <Text style={styles.sub}>Requests you swiped on + your offers</Text>
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
            label={`Interested (${counts.interested})`}
            active={filter === "interested"}
            onPress={() => setFilter("interested")}
          />
          <FilterBtn
            label={`Skipped (${counts.skipped})`}
            active={filter === "skipped"}
            onPress={() => setFilter("skipped")}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerCard}>
          <Text style={styles.centerTitle}>Loading…</Text>
          <Text style={styles.centerSub}>Fetching swipes & offers</Text>
        </View>
      ) : visible.length === 0 ? (
        <View style={styles.centerCard}>
          <Text style={styles.centerTitle}>No items</Text>
          <Text style={styles.centerSub}>
            {filter === "all"
              ? "Swipe right on a request to see it here."
              : filter === "interested"
                ? "No interested requests yet."
                : "No skipped requests yet."}
          </Text>

          <Pressable
            style={styles.btnPrimary}
            onPress={() => router.push("/(tabs)/marketplace" as any)}
          >
            <Text style={styles.btnPrimaryText}>Go to Marketplace</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 18 }}>
          {visible.map(({ request, direction }) => {
            const latest = latestOfferByRequestId.get(request.id);

            // Derive label + CTA based on latest offer
            const offerState: OfferStatus | "none" = latest?.status ?? "none";

            const canSendOffer =
              direction === "right" &&
              (offerState === "none" || offerState === "rejected");

            const showPending = offerState === "pending";
            const showAccepted = offerState === "accepted";
            const showRejected = offerState === "rejected";

            return (
              <View key={request.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.category}>{request.category}</Text>
                    <Text style={styles.title} numberOfLines={1}>
                      {request.title}
                    </Text>

                    <Text style={styles.by} numberOfLines={1}>
                      Posted by {request.profiles?.email ?? "unknown"}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => removeSwipe(request.id)}
                    style={styles.removeBtn}
                  >
                    <Feather
                      name="trash-2"
                      size={16}
                      color={theme.primaryText}
                    />
                  </Pressable>
                </View>

                <Text style={styles.desc} numberOfLines={2}>
                  {request.description}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>
                      ${request.budget_min.toLocaleString()} - $
                      {request.budget_max.toLocaleString()}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.pill,
                      direction === "right"
                        ? styles.pillInterested
                        : styles.pillSkipped,
                    ]}
                  >
                    <Text style={styles.pillText}>
                      {direction === "right" ? "Interested" : "Skipped"}
                    </Text>
                  </View>
                </View>

                {/* Offer status row */}
                <View style={styles.statusRow}>
                  {offerState === "none" && (
                    <View style={[styles.statusPill, styles.statusNone]}>
                      <Text style={styles.statusText}>NO OFFER YET</Text>
                    </View>
                  )}

                  {showPending && (
                    <View style={[styles.statusPill, styles.statusPending]}>
                      <Text style={styles.statusText}>OFFER PENDING</Text>
                    </View>
                  )}

                  {showAccepted && (
                    <View style={[styles.statusPill, styles.statusAccepted]}>
                      <Text style={styles.statusText}>ACCEPTED</Text>
                    </View>
                  )}

                  {showRejected && (
                    <View style={[styles.statusPill, styles.statusRejected]}>
                      <Text style={styles.statusText}>
                        REJECTED — send a new offer
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                  {canSendOffer && (
                    <Pressable
                      style={styles.btnPrimary}
                      onPress={() => openCreateOffer(request.id)}
                    >
                      <Text style={styles.btnPrimaryText}>
                        {offerState === "rejected"
                          ? "Send new offer"
                          : "Send offer"}
                      </Text>
                    </Pressable>
                  )}

                  {showPending && (
                    <Pressable
                      style={styles.btnSecondary}
                      onPress={() =>
                        Alert.alert(
                          "Pending",
                          "You already have a pending offer for this request.",
                        )
                      }
                    >
                      <Text style={styles.btnSecondaryText}>View pending</Text>
                    </Pressable>
                  )}

                  {showAccepted && (
                    <Pressable style={styles.btnPrimary} onPress={chatSoon}>
                      <Text style={styles.btnPrimaryText}>Chat</Text>
                    </Pressable>
                  )}

                  {/* If skipped, no offer actions */}
                  {direction === "left" && (
                    <Text style={styles.skippedHint}>
                      Skipped items are read-only.
                    </Text>
                  )}
                </View>
              </View>
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
  success: "#16A34A",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
  accentSoft: "#DBEAFE",
  dangerSoft: "#FEE2E2",
  successSoft: "#DCFCE7",
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  header: { marginBottom: 10 },
  h1: { fontSize: 22, fontWeight: "900", color: theme.primaryText },
  sub: { marginTop: 4, color: theme.secondaryText },

  filtersWrap: { alignItems: "center", marginBottom: 12 },
  filters: {
    flexDirection: "row",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 6,
    gap: 6,
    justifyContent: "center",
  },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 },
  filterBtnActive: { backgroundColor: theme.accentSoft },
  filterText: { fontWeight: "900", color: theme.secondaryText, fontSize: 12 },
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
  centerTitle: { fontSize: 16, fontWeight: "900", color: theme.primaryText },
  centerSub: { color: theme.secondaryText, textAlign: "center" },

  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  category: { color: theme.secondaryText, fontWeight: "900", fontSize: 12 },
  title: {
    color: theme.primaryText,
    fontWeight: "900",
    fontSize: 16,
    marginTop: 2,
  },
  by: {
    color: theme.secondaryText,
    fontWeight: "700",
    fontSize: 12,
    marginTop: 4,
  },

  removeBtn: {
    height: 36,
    width: 36,
    borderRadius: 12,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },

  desc: { marginTop: 10, color: theme.secondaryText, lineHeight: 18 },

  metaRow: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bg,
  },
  pillInterested: {
    backgroundColor: theme.accentSoft,
    borderColor: theme.primary,
  },
  pillSkipped: { backgroundColor: theme.border, borderColor: theme.border },
  pillText: { fontSize: 12, fontWeight: "900", color: theme.primaryText },

  statusRow: { marginTop: 12 },
  statusPill: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 14 },
  statusNone: { backgroundColor: theme.border },
  statusPending: { backgroundColor: theme.accentSoft },
  statusAccepted: { backgroundColor: theme.successSoft },
  statusRejected: { backgroundColor: theme.dangerSoft },
  statusText: { fontWeight: "900", fontSize: 12, color: theme.primaryText },

  actionRow: { marginTop: 12, gap: 10 },
  btnPrimary: {
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  btnPrimaryText: { color: "white", fontWeight: "900" },

  btnSecondary: {
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  btnSecondaryText: { color: theme.primaryText, fontWeight: "900" },

  skippedHint: {
    color: theme.secondaryText,
    fontWeight: "700",
    textAlign: "center",
  },
});
