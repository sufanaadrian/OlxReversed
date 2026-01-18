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

type Direction = "left" | "right";
type Filter = "all" | "interested" | "skipped";

type SwipeRow = {
  request_id: string;
  direction: Direction;
  created_at: string;
};

type RequestRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  location: string | null;
  created_at: string;
  status: "active" | "closed";
  user_id: string;
};

type OfferMini = {
  id: string;
  request_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

type Item = {
  swipe: SwipeRow;
  request: RequestRow;
};

export default function MyOffersScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [offersByRequestId, setOffersByRequestId] = useState<
    Map<string, OfferMini>
  >(new Map());
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    setLoading(true);

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;

    if (!user) {
      setItems([]);
      setOffersByRequestId(new Map());
      setLoading(false);
      return;
    }

    // 1) Load swipes for this user
    const { data: swipes, error: swErr } = await supabase
      .from("request_swipes")
      .select("request_id,direction,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (swErr) {
      Alert.alert("Error", swErr.message);
      setItems([]);
      setOffersByRequestId(new Map());
      setLoading(false);
      return;
    }

    const swipeList = (swipes ?? []) as SwipeRow[];

    if (swipeList.length === 0) {
      setItems([]);
      setOffersByRequestId(new Map());
      setLoading(false);
      return;
    }

    const requestIds = swipeList.map((s) => s.request_id);

    // 2) Load requests referenced by swipes
    const { data: reqs, error: reqErr } = await supabase
      .from("requests")
      .select(
        "id,title,description,category,budget_min,budget_max,location,created_at,status,user_id",
      )
      .in("id", requestIds);

    if (reqErr) {
      Alert.alert("Error", reqErr.message);
      setItems([]);
      setOffersByRequestId(new Map());
      setLoading(false);
      return;
    }

    const reqMap = new Map<string, RequestRow>(
      (reqs ?? []).map((r: any) => [r.id, r as RequestRow]),
    );

    const merged: Item[] = swipeList
      .map((s) => {
        const req = reqMap.get(s.request_id);
        if (!req) return null;
        return { swipe: s, request: req };
      })
      .filter(Boolean) as Item[];

    setItems(merged);

    // 3) Load MY offers for those requests (ALL statuses)
    const { data: myOffers, error: offErr } = await supabase
      .from("offers")
      .select("id,request_id,status,created_at")
      .eq("user_id", user.id)
      .in("request_id", requestIds);

    if (offErr) {
      Alert.alert("Error", offErr.message);
      setOffersByRequestId(new Map());
      setLoading(false);
      return;
    }

    // If multiple offers exist (shouldn't due to unique constraint),
    // keep the newest one for safety.
    const map = new Map<string, OfferMini>();
    (myOffers ?? []).forEach((o: any) => {
      const offer = o as OfferMini;
      const prev = map.get(offer.request_id);
      if (!prev) {
        map.set(offer.request_id, offer);
        return;
      }
      if (
        new Date(offer.created_at).getTime() >
        new Date(prev.created_at).getTime()
      ) {
        map.set(offer.request_id, offer);
      }
    });

    setOffersByRequestId(map);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const counts = useMemo(() => {
    const interested = items.filter(
      (x) => x.swipe.direction === "right",
    ).length;
    const skipped = items.filter((x) => x.swipe.direction === "left").length;
    const all = items.length;
    return { all, interested, skipped };
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "interested")
      return items.filter((x) => x.swipe.direction === "right");
    return items.filter((x) => x.swipe.direction === "left");
  }, [items, filter]);

  const removeSwipe = async (requestId: string) => {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) return;

    const { error } = await supabase
      .from("request_swipes")
      .delete()
      .eq("user_id", user.id)
      .eq("request_id", requestId);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    // update UI immediately
    setItems((prev) => prev.filter((x) => x.request.id !== requestId));
    setOffersByRequestId((prev) => {
      const next = new Map(prev);
      next.delete(requestId);
      return next;
    });
  };

  const withdrawOffer = async (offerId: string, requestId: string) => {
    Alert.alert("Withdraw offer", "Remove your offer for this request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Withdraw",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("offers")
            .delete()
            .eq("id", offerId);
          if (error) {
            Alert.alert("Error", error.message);
            return;
          }
          setOffersByRequestId((prev) => {
            const next = new Map(prev);
            next.delete(requestId);
            return next;
          });
        },
      },
    ]);
  };

  const openCreateOffer = (requestId: string, offerId?: string) => {
    router.push({
      pathname: "/create-offer",
      params: offerId ? { requestId, offerId } : { requestId },
    } as any);
  };

  const chatSoon = () => Alert.alert("Functionality will be added soon");

  return (
    <View style={styles.page}>
      <Text style={styles.header}>My Offers</Text>

      {/* Filters (centered) */}
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
        <View style={styles.center}>
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.titleEmpty}>Nothing here</Text>
          <Text style={styles.muted}>
            Swipe requests in Marketplace to populate this list.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 18 }}>
          {filtered.map(({ request, swipe }) => {
            const isInterested = swipe.direction === "right";
            const myOffer = offersByRequestId.get(request.id);
            const offerStatus = myOffer?.status; // pending/accepted/rejected/undefined

            const canEditOrWithdraw = isInterested && offerStatus === "pending";
            const canChat = isInterested && offerStatus === "accepted";

            return (
              <View key={request.id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.badge}>{request.category}</Text>

                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    {offerStatus && (
                      <View
                        style={[
                          styles.statusBadge,
                          offerStatus === "pending" && styles.statusPending,
                          offerStatus === "accepted" && styles.statusAccepted,
                          offerStatus === "rejected" && styles.statusRejected,
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {offerStatus.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.cardTitle}>{request.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={3}>
                  {request.description}
                </Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaStrong}>
                    ${request.budget_min.toLocaleString()} – $
                    {request.budget_max.toLocaleString()}
                  </Text>
                  {!!request.location && (
                    <Text style={styles.metaMuted}>• {request.location}</Text>
                  )}
                </View>

                <View style={styles.footerRow}>
                  <Text style={styles.smallMuted}>
                    {isInterested ? "Interested" : "Skipped"} •{" "}
                    {new Date(swipe.created_at).toLocaleDateString()}
                  </Text>

                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/request/[id]",
                        params: { id: request.id },
                      } as any)
                    }
                    style={styles.openBtn}
                  >
                    <Text style={styles.openBtnText}>Open</Text>
                  </Pressable>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => removeSwipe(request.id)}
                    style={styles.removeBtn}
                  >
                    <Feather name="trash-2" size={16} color={theme.danger} />
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>

                  {/* Only interested items can have offer actions */}
                  {isInterested && (
                    <>
                      {/* No offer yet */}
                      {!myOffer && (
                        <Pressable
                          onPress={() => openCreateOffer(request.id)}
                          style={styles.primaryBtn}
                        >
                          <Text style={styles.primaryText}>Send offer</Text>
                        </Pressable>
                      )}

                      {/* Pending offer -> edit/withdraw */}
                      {canEditOrWithdraw && myOffer && (
                        <View style={styles.splitActions}>
                          <Pressable
                            onPress={() =>
                              openCreateOffer(request.id, myOffer.id)
                            }
                            style={styles.primaryBtn}
                          >
                            <Text style={styles.primaryText}>Edit offer</Text>
                          </Pressable>

                          <Pressable
                            onPress={() =>
                              withdrawOffer(myOffer.id, request.id)
                            }
                            style={styles.withdrawBtn}
                          >
                            <Text style={styles.withdrawText}>Withdraw</Text>
                          </Pressable>
                        </View>
                      )}

                      {/* Accepted -> chat */}
                      {canChat && (
                        <Pressable onPress={chatSoon} style={styles.chatBtn}>
                          <Text style={styles.chatBtnText}>Chat</Text>
                        </Pressable>
                      )}

                      {/* Rejected -> no actions */}
                    </>
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
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
  accentSoft: "#DBEAFE",
  danger: "#B91C1C",
  success: "#16A34A",
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: theme.bg,
  },
  header: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.primaryText,
    marginBottom: 12,
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

  center: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
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
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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

  offerSentBadge: {
    backgroundColor: theme.accentSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  offerSentText: { fontSize: 12, fontWeight: "900", color: theme.primary },

  statusBadge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  statusPending: {
    borderColor: theme.primary,
    backgroundColor: theme.accentSoft,
  },
  statusAccepted: { borderColor: theme.success, backgroundColor: "#DCFCE7" },
  statusRejected: { borderColor: "#FCA5A5", backgroundColor: "#FEE2E2" },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.primaryText,
  },

  cardTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "900",
    color: theme.primaryText,
  },
  cardDesc: { marginTop: 6, color: theme.secondaryText, lineHeight: 18 },

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

  openBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  openBtnText: { color: "white", fontWeight: "900", fontSize: 12 },

  actionsRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  removeText: { fontWeight: "900", color: theme.danger, fontSize: 12 },

  primaryBtn: {
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "white", fontWeight: "900", fontSize: 12 },

  splitActions: { flexDirection: "row", gap: 10, alignItems: "center" },

  withdrawBtn: {
    height: 40,
    borderRadius: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: theme.surface,
  },
  withdrawText: { fontWeight: "900", color: theme.danger, fontSize: 12 },

  chatBtn: {
    height: 40,
    borderRadius: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.success,
  },
  chatBtnText: { color: "white", fontWeight: "900", fontSize: 12 },
});
