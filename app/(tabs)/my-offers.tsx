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
import { Screen } from "../../src/components/Screen";
import { supabase } from "../../src/lib/supabase";

type SwipeDirection = "left" | "right";
type OfferStatus = "pending" | "accepted" | "rejected";
type CounterStatus = "pending" | "accepted" | "rejected" | "withdrawn";
type Filter = "all" | "interested" | "skipped";

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

type OfferRow = {
  id: string;
  request_id: string;
  user_id: string;
  status: OfferStatus;
  price: number;
  description: string;
  created_at: string;
};

type CounterOfferRow = {
  id: string;
  request_id: string;
  offer_id: string; // original offer id
  requester_id: string;
  seller_id: string; // me
  price: number;
  message: string | null;
  status: CounterStatus;
  created_at: string;
};

export default function MyOffersScreen() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const [swipes, setSwipes] = useState<
    Array<{ request: RequestRow; direction: SwipeDirection; swipedAt: string }>
  >([]);

  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [counterOffers, setCounterOffers] = useState<CounterOfferRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);

    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;

    if (!uid) {
      setSwipes([]);
      setOffers([]);
      setCounterOffers([]);
      setLoading(false);
      return;
    }

    // 1) swipes + requests
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
          profiles!requests_user_id_fkey ( email )
        )
      `,
      )
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (swipeErr) {
      Alert.alert("Error", swipeErr.message);
      setLoading(false);
      return;
    }

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
      .filter(Boolean) as Array<{
      request: RequestRow;
      direction: SwipeDirection;
      swipedAt: string;
    }>;

    setSwipes(normalizedSwipes);

    // 2) my offers (as seller)
    const { data: offerData, error: offerErr } = await supabase
      .from("offers")
      .select("id,request_id,user_id,status,price,description,created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (offerErr) {
      Alert.alert("Error", offerErr.message);
      setOffers([]);
      setLoading(false);
      return;
    }

    setOffers((offerData ?? []) as OfferRow[]);

    // 3) counter offers where I am seller
    const { data: counterData, error: counterErr } = await supabase
      .from("counter_offers")
      .select(
        "id,request_id,offer_id,requester_id,seller_id,price,message,status,created_at",
      )
      .eq("seller_id", uid)
      .order("created_at", { ascending: false });

    if (counterErr) {
      Alert.alert("Error", counterErr.message);
      setCounterOffers([]);
      setLoading(false);
      return;
    }

    setCounterOffers((counterData ?? []) as CounterOfferRow[]);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Latest offer per request (newest first because offers state already ordered desc)
  const latestOfferByRequestId = useMemo(() => {
    const map = new Map<string, OfferRow>();
    for (const o of offers) {
      if (!map.has(o.request_id)) map.set(o.request_id, o);
    }
    return map;
  }, [offers]);

  // Latest counter-offer per request (newest first)
  const latestCounterByRequestId = useMemo(() => {
    const map = new Map<string, CounterOfferRow>();
    for (const c of counterOffers) {
      if (!map.has(c.request_id)) map.set(c.request_id, c);
    }
    return map;
  }, [counterOffers]);

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
    router.push({
      pathname: "/(modals)/create-offer",
      params: { requestId },
    } as any);
  };

  const chatSoon = () =>
    Alert.alert("Soon", "Chat functionality will be added soon");

  /**
   * IMPORTANT FIX:
   * When seller ACCEPTS a counter-offer, also mark the original offer as ACCEPTED and set its price to counter price.
   * This makes state consistent across refresh and across both accounts.
   */
  const acceptCounter = async (counter: CounterOfferRow) => {
    // 1) accept counter
    const { error: cErr } = await supabase
      .from("counter_offers")
      .update({ status: "accepted" })
      .eq("id", counter.id);

    if (cErr) return Alert.alert("Error", cErr.message);

    // 2) update original offer to accepted + price = counter price
    const { error: oErr } = await supabase
      .from("offers")
      .update({ status: "accepted", price: counter.price })
      .eq("id", counter.offer_id);

    if (oErr) return Alert.alert("Error", oErr.message);

    Alert.alert("Accepted", "Counter-offer accepted. Next: chat (soon).");
    load();
  };

  const rejectCounter = async (counter: CounterOfferRow) => {
    const { error } = await supabase
      .from("counter_offers")
      .update({ status: "rejected" })
      .eq("id", counter.id);

    if (error) return Alert.alert("Error", error.message);

    load();
  };

  return (
    <Screen>
      <View style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.h1}>My Offers</Text>
          <Text style={styles.sub}>
            Requests you swiped + your offers + counter-offers
          </Text>
        </View>

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
              Swipe right on a request to see it here.
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
              const latestOffer = latestOfferByRequestId.get(request.id);
              const counter = latestCounterByRequestId.get(request.id);

              const offerState: OfferStatus | "none" =
                latestOffer?.status ?? "none";

              /**
               * ✅ COUNTER-OFFER OVERRIDES OFFER UI
               * If counter is pending -> user should respond to counter, not send a new offer.
               * If counter is accepted -> treat as accepted.
               */
              const counterPending = counter?.status === "pending";
              const counterAccepted = counter?.status === "accepted";
              const counterRejected =
                counter?.status === "rejected" ||
                counter?.status === "withdrawn";

              // Effective state for UI
              let effectiveState:
                | "none"
                | OfferStatus
                | "counter_pending"
                | "counter_accepted" = offerState;

              if (counterPending) effectiveState = "counter_pending";
              if (counterAccepted) effectiveState = "counter_accepted";
              // if counter rejected/withdrawn -> fall back to offerState (likely rejected)

              const canSendOffer =
                direction === "right" &&
                !counterPending && // 🚫 block resend while counter pending
                !counterAccepted && // 🚫 block resend when counter accepted
                (offerState === "none" || offerState === "rejected");

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
                  </View>

                  <Text style={styles.desc} numberOfLines={2}>
                    {request.description}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.pill}>
                      <Text style={styles.pillText}>
                        €{request.budget_min.toLocaleString()} - €
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

                  {/* Counter-offer banner */}
                  {counter && (
                    <View style={styles.counterBox}>
                      <Text style={styles.counterTitle}>
                        Counter-offer: €{Number(counter.price).toLocaleString()}
                      </Text>
                      {!!counter.message && (
                        <Text style={styles.counterMsg} numberOfLines={3}>
                          {counter.message}
                        </Text>
                      )}
                      <Text style={styles.counterStatus}>
                        Status: {counter.status.toUpperCase()}
                      </Text>

                      {counterPending && (
                        <View style={styles.counterActions}>
                          <Pressable
                            style={styles.btnPrimary}
                            onPress={() => acceptCounter(counter)}
                          >
                            <Text style={styles.btnPrimaryText}>
                              Accept counter
                            </Text>
                          </Pressable>
                          <Pressable
                            style={styles.btnSecondary}
                            onPress={() => rejectCounter(counter)}
                          >
                            <Text style={styles.btnSecondaryText}>Reject</Text>
                          </Pressable>
                        </View>
                      )}

                      {counterAccepted && (
                        <Pressable style={styles.btnPrimary} onPress={chatSoon}>
                          <Text style={styles.btnPrimaryText}>Chat</Text>
                        </Pressable>
                      )}
                    </View>
                  )}

                  {/* Status pill */}
                  <View style={styles.statusRow}>
                    {effectiveState === "none" && (
                      <View style={[styles.statusPill, styles.statusNone]}>
                        <Text style={styles.statusText}>NO OFFER YET</Text>
                      </View>
                    )}
                    {effectiveState === "pending" && (
                      <View style={[styles.statusPill, styles.statusPending]}>
                        <Text style={styles.statusText}>OFFER PENDING</Text>
                      </View>
                    )}
                    {effectiveState === "accepted" && (
                      <View style={[styles.statusPill, styles.statusAccepted]}>
                        <Text style={styles.statusText}>ACCEPTED</Text>
                      </View>
                    )}
                    {effectiveState === "rejected" && (
                      <View style={[styles.statusPill, styles.statusRejected]}>
                        <Text style={styles.statusText}>
                          REJECTED — YOU CAN RESEND
                        </Text>
                      </View>
                    )}
                    {effectiveState === "counter_pending" && (
                      <View style={[styles.statusPill, styles.statusPending]}>
                        <Text style={styles.statusText}>
                          COUNTER-OFFER PENDING
                        </Text>
                      </View>
                    )}
                    {effectiveState === "counter_accepted" && (
                      <View style={[styles.statusPill, styles.statusAccepted]}>
                        <Text style={styles.statusText}>
                          COUNTER-OFFER ACCEPTED
                        </Text>
                      </View>
                    )}
                  </View>

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

                    {/* If counter pending, explicitly explain why resend isn't available */}
                    {counterPending && (
                      <Text style={styles.skippedHint}>
                        A counter-offer is pending. Respond to it above.
                      </Text>
                    )}

                    {(offerState === "accepted" || counterAccepted) && (
                      <Pressable style={styles.btnPrimary} onPress={chatSoon}>
                        <Text style={styles.btnPrimaryText}>Chat</Text>
                      </Pressable>
                    )}

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
    </Screen>
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
    flexWrap: "wrap",
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

  counterBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bg,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  counterTitle: { fontWeight: "900", color: theme.primaryText },
  counterMsg: { color: theme.secondaryText, lineHeight: 18 },
  counterStatus: {
    fontWeight: "900",
    color: theme.secondaryText,
    fontSize: 12,
  },
  counterActions: { flexDirection: "row", gap: 10, marginTop: 8 },

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
