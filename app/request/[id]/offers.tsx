import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Screen } from "../../../src/components/Screen";
import { supabase } from "../../../src/lib/supabase";

type OfferStatus = "pending" | "accepted" | "rejected";
type Filter = "all" | OfferStatus;

type OfferRow = {
  id: string;
  request_id: string;
  user_id: string;
  price: number;
  description: string;
  status: OfferStatus;
  created_at: string;
  profiles?: { email: string | null } | null; // optional embed
};

type RequestRow = {
  id: string;
  user_id: string;
  title: string;
  status: string;
};

export default function RequestOffersScreen() {
  const params = useLocalSearchParams();
  const requestId = (params?.id as string) ?? "";

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<RequestRow | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);

    // Request (owner must be able to read)
    const { data: req, error: reqErr } = await supabase
      .from("requests")
      .select("id,user_id,title,status")
      .eq("id", requestId)
      .maybeSingle();

    if (reqErr) {
      Alert.alert("Error", reqErr.message);
      setRequest(null);
      setOffers([]);
      setLoading(false);
      return;
    }

    setRequest(req as any);

    // Offers: FETCH ALL STATUSES (no status filter)
    // Optional: embed offerer email from profiles if you want.
    const { data: off, error: offErr } = await supabase
      .from("offers")
      .select(
        `
        id,
        request_id,
        user_id,
        price,
        description,
        status,
        created_at,
        profiles!offers_user_id_fkey (
          email
        )
      `,
      )
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });

    if (offErr) {
      Alert.alert("Error", offErr.message);
      setOffers([]);
      setLoading(false);
      return;
    }

    setOffers((off ?? []) as any);
    setLoading(false);
  }, [requestId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const counts = useMemo(() => {
    const all = offers.length;
    const pending = offers.filter((o) => o.status === "pending").length;
    const accepted = offers.filter((o) => o.status === "accepted").length;
    const rejected = offers.filter((o) => o.status === "rejected").length;
    return { all, pending, accepted, rejected };
  }, [offers]);

  const filtered = useMemo(() => {
    if (filter === "all") return offers;
    return offers.filter((o) => o.status === filter);
  }, [offers, filter]);

  const acceptOffer = async (offerId: string) => {
    // Accept selected offer
    const { error: accErr } = await supabase
      .from("offers")
      .update({ status: "accepted" })
      .eq("id", offerId);

    if (accErr) return Alert.alert("Error", accErr.message);

    // Reject all other pending offers for this request
    const { error: rejErr } = await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("request_id", requestId)
      .neq("id", offerId)
      .eq("status", "pending");

    if (rejErr) return Alert.alert("Error", rejErr.message);

    // Mark request as matched/in_progress (NOT closed)
    await supabase
      .from("requests")
      .update({ status: "matched" })
      .eq("id", requestId);

    await load();
  };

  const rejectOffer = async (offerId: string) => {
    const { error } = await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("id", offerId);
    if (error) return Alert.alert("Error", error.message);
    await load();
  };

  return (
    <Screen>
      <View style={styles.page}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color={theme.primaryText} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Offers</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {request?.title ?? "Request"}
            </Text>
          </View>
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
              label={`Pending (${counts.pending})`}
              active={filter === "pending"}
              onPress={() => setFilter("pending")}
            />
            <FilterBtn
              label={`Accepted (${counts.accepted})`}
              active={filter === "accepted"}
              onPress={() => setFilter("accepted")}
            />
            <FilterBtn
              label={`Rejected (${counts.rejected})`}
              active={filter === "rejected"}
              onPress={() => setFilter("rejected")}
            />
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centerCard}>
            <Text style={styles.muted}>Loading…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centerCard}>
            <Text style={styles.titleEmpty}>No offers</Text>
            <Text style={styles.muted}>
              There are no offers in this filter.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 18 }}>
            {filtered.map((o) => {
              const email = o.profiles?.email ?? "user";
              const isPending = o.status === "pending";
              const isAccepted = o.status === "accepted";

              return (
                <View key={o.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.seller}>{email}</Text>
                    <View
                      style={[
                        styles.statusPill,
                        isAccepted
                          ? styles.pillAccepted
                          : o.status === "rejected"
                            ? styles.pillRejected
                            : styles.pillPending,
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {o.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.price}>
                    ${Number(o.price).toLocaleString()}
                  </Text>
                  <Text style={styles.desc}>{o.description}</Text>

                  {isPending && (
                    <View style={styles.actionsRow}>
                      <Pressable
                        onPress={() => rejectOffer(o.id)}
                        style={[styles.btn, styles.btnSecondary]}
                      >
                        <Text style={styles.btnSecondaryText}>Reject</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => acceptOffer(o.id)}
                        style={[styles.btn, styles.btnPrimary]}
                      >
                        <Text style={styles.btnPrimaryText}>Accept</Text>
                      </Pressable>
                    </View>
                  )}

                  {isAccepted && (
                    <View style={styles.actionsRow}>
                      <Pressable
                        onPress={() =>
                          Alert.alert(
                            "Soon",
                            "Chat functionality will be added soon",
                          )
                        }
                        style={[styles.btn, styles.btnPrimary]}
                      >
                        <Text style={styles.btnPrimaryText}>Chat</Text>
                      </Pressable>
                    </View>
                  )}
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
  success: "#16A34A",
  danger: "#DC2626",
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  backBtn: {
    height: 40,
    width: 40,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: theme.primaryText },
  headerSub: { fontSize: 12, color: theme.secondaryText },

  filtersWrap: { alignItems: "center", marginBottom: 12 },
  filters: {
    flexDirection: "row",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 6,
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "center",
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
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seller: { fontSize: 13, fontWeight: "900", color: theme.primaryText },

  statusPill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  pillPending: { backgroundColor: theme.accentSoft },
  pillAccepted: { backgroundColor: "#DCFCE7" },
  pillRejected: { backgroundColor: "#FEE2E2" },
  statusText: { fontSize: 12, fontWeight: "900", color: theme.primaryText },

  price: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "900",
    color: theme.primaryText,
  },
  desc: { marginTop: 6, color: theme.secondaryText, lineHeight: 18 },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: theme.primary },
  btnPrimaryText: { color: "white", fontWeight: "900" },
  btnSecondary: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  btnSecondaryText: { color: theme.primaryText, fontWeight: "900" },
});
