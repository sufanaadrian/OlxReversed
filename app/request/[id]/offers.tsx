import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Screen } from "../../../src/components/Screen";
import { useCurrency } from "../../../src/context/CurrencyContext";
import { useTranslation } from "../../../src/context/LanguageContext";
import { supabase } from "../../../src/lib/supabase";
import { styles, theme } from "./offers.styles";

type OfferStatus = "pending" | "accepted" | "rejected" | "withdrawn";
type CounterStatus = "pending" | "accepted" | "rejected" | "withdrawn";
type Filter = "all" | OfferStatus;

type OfferRow = {
  id: string;
  request_id: string;
  user_id: string;
  price: number;
  description: string;
  status: OfferStatus;
  created_at: string;
  profiles?: { email: string | null } | null;
};

type CounterOfferRow = {
  id: string;
  request_id: string;
  offer_id: string;
  requester_id: string;
  seller_id: string;
  price: number;
  message: string | null;
  status: CounterStatus;
  created_at: string;
};

type RequestRow = {
  id: string;
  user_id: string;
  title: string;
  status: string;
};

type OfferSlotInfo = {
  offer_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

function formatTime(t: string): string {
  return t.slice(0, 5);
}

export default function RequestOffersScreen() {
  const params = useLocalSearchParams();
  const requestId = (params?.id as string) ?? "";
  const t = useTranslation();
  const { formatPrice } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<RequestRow | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [counters, setCounters] = useState<CounterOfferRow[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [offerSlots, setOfferSlots] = useState<OfferSlotInfo[]>([]);

  const load = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);

    const { data: req, error: reqErr } = await supabase
      .from("requests")
      .select("id,user_id,title,status")
      .eq("id", requestId)
      .maybeSingle();

    if (reqErr) {
      Alert.alert(t("error"), reqErr.message);
      setRequest(null);
      setOffers([]);
      setCounters([]);
      setLoading(false);
      return;
    }

    setRequest(req as any);

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
      Alert.alert(t("error"), offErr.message);
      setOffers([]);
      setCounters([]);
      setLoading(false);
      return;
    }

    setOffers((off ?? []) as any);

    const { data: co, error: coErr } = await supabase
      .from("counter_offers")
      .select(
        "id,request_id,offer_id,requester_id,seller_id,price,message,status,created_at",
      )
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });

    if (coErr) {
      Alert.alert(t("error"), coErr.message);
      setCounters([]);
      setLoading(false);
      return;
    }

    setCounters((co ?? []) as any);

    // Load offer slots with availability info
    const offerIds = (off ?? []).map((o: any) => o.id);
    if (offerIds.length > 0) {
      const { data: slotsRaw, error: slotsErr } = await supabase
        .from("offer_slots")
        .select("offer_id,availability_id")
        .in("offer_id", offerIds);

      if (slotsErr) {
        console.log("offer_slots query error:", slotsErr);
        setOfferSlots([]);
      } else if (slotsRaw && slotsRaw.length > 0) {
        const availIds = [
          ...new Set(slotsRaw.map((s: any) => s.availability_id)),
        ];
        const { data: availData } = await supabase
          .from("request_availability")
          .select("id,day_of_week,start_time,end_time")
          .in("id", availIds);

        const availMap = new Map((availData ?? []).map((a: any) => [a.id, a]));
        const mapped: OfferSlotInfo[] = [];
        for (const s of slotsRaw as any[]) {
          const a = availMap.get(s.availability_id);
          if (a) {
            mapped.push({
              offer_id: s.offer_id,
              day_of_week: a.day_of_week,
              start_time: a.start_time,
              end_time: a.end_time,
            });
          }
        }
        setOfferSlots(mapped);
      } else {
        setOfferSlots([]);
      }
    } else {
      setOfferSlots([]);
    }

    setLoading(false);
  }, [requestId, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const latestCounterByOfferId = useMemo(() => {
    const map = new Map<string, CounterOfferRow>();
    for (const c of counters) {
      if (!map.has(c.offer_id)) map.set(c.offer_id, c);
    }
    return map;
  }, [counters]);

  const counts = useMemo(() => {
    const all = offers.length;

    const pending = offers.filter((o) => {
      if (o.status === "withdrawn") return false;
      const c = latestCounterByOfferId.get(o.id);
      if (c?.status === "pending") return true;
      return o.status === "pending";
    }).length;

    const accepted = offers.filter((o) => {
      if (o.status === "withdrawn") return false;
      const c = latestCounterByOfferId.get(o.id);
      if (c?.status === "accepted") return true;
      return o.status === "accepted";
    }).length;

    const rejected = offers.filter((o) => {
      if (o.status === "withdrawn") return false; // ✅ keep withdrawn out
      const c = latestCounterByOfferId.get(o.id);
      if (c?.status === "accepted") return false;
      return o.status === "rejected";
    }).length;

    const withdrawn = offers.filter((o) => o.status === "withdrawn").length;

    return { all, pending, accepted, rejected, withdrawn };
  }, [offers, latestCounterByOfferId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return offers;

    return offers.filter((o) => {
      const c = latestCounterByOfferId.get(o.id);

      const effective: OfferStatus =
        o.status === "withdrawn"
          ? "withdrawn"
          : c?.status === "accepted"
            ? "accepted"
            : c?.status === "pending"
              ? "pending"
              : o.status;

      return effective === filter;
    });
  }, [offers, filter, latestCounterByOfferId]);

  const acceptOffer = async (offerId: string) => {
    const { error: accErr } = await supabase
      .from("offers")
      .update({ status: "accepted" })
      .eq("id", offerId);

    if (accErr) return Alert.alert(t("error"), accErr.message);

    const { error: rejErr } = await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("request_id", requestId)
      .neq("id", offerId)
      .eq("status", "pending");

    if (rejErr) return Alert.alert(t("error"), rejErr.message);

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

    if (error) return Alert.alert(t("error"), error.message);
    await load();
  };

  const openChat = () => {
    if (!requestId) return;
    router.push({
      pathname: "/request/[id]/chat",
      params: { id: requestId },
    } as any);
  };

  const openRejectMenu = (offer: OfferRow) => {
    const email = offer.profiles?.email ?? "user";
    const existingCounter = latestCounterByOfferId.get(offer.id);

    if (existingCounter?.status === "pending") {
      Alert.alert(t("counterAlreadySent"), t("counterAlreadySentMsg"), [
        { text: t("cancel") },
        {
          text: t("viewCounter"),
          onPress: () =>
            router.push({
              pathname: "/(modals)/counter-offer",
              params: {
                offerId: offer.id,
                requestId: offer.request_id,
                sellerId: offer.user_id,
                sellerEmail: email,
                originalPrice: String(offer.price),
              },
            } as any),
        },
      ]);
      return;
    }

    Alert.alert(t("rejectOfferTitle"), t("chooseOption"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("reject"),
        style: "destructive",
        onPress: () => rejectOffer(offer.id),
      },
      {
        text: t("rejectWithOffer"),
        onPress: () => {
          router.push({
            pathname: "/(modals)/counter-offer",
            params: {
              offerId: offer.id,
              requestId: offer.request_id,
              sellerId: offer.user_id,
              sellerEmail: email,
              originalPrice: String(offer.price),
            },
          } as any);
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.page}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color={theme.primaryText} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t("offersHeader")}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {request?.title ?? ""}
            </Text>
          </View>
        </View>

        <View style={styles.filtersWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            <FilterBtn
              label={`${t("all")} (${counts.all})`}
              active={filter === "all"}
              onPress={() => setFilter("all")}
            />
            <FilterBtn
              label={`${t("pending")} (${counts.pending})`}
              active={filter === "pending"}
              onPress={() => setFilter("pending")}
            />
            <FilterBtn
              label={`${t("accepted")} (${counts.accepted})`}
              active={filter === "accepted"}
              onPress={() => setFilter("accepted")}
            />
            <FilterBtn
              label={`${t("rejected")} (${counts.rejected})`}
              active={filter === "rejected"}
              onPress={() => setFilter("rejected")}
            />
            <FilterBtn
              label={`${t("withdrawn")} (${counts.withdrawn})`}
              active={filter === "withdrawn"}
              onPress={() => setFilter("withdrawn")}
            />
          </ScrollView>
          <View pointerEvents="none" style={styles.scrollHint}>
            <Text style={styles.scrollHintArrow}>›</Text>
          </View>
        </View>
        {counts.withdrawn > 0 && (
          <View style={styles.warnBox}>
            <Feather name="alert-triangle" size={16} color={theme.danger} />
            <Text style={styles.warnText}>
              {counts.withdrawn}{" "}
              {counts.withdrawn === 1
                ? t("offersWithdrawnWarning_one")
                : t("offersWithdrawnWarning_other")}
            </Text>
          </View>
        )}

        {loading ? (
          <View style={styles.centerCard}>
            <Text style={styles.muted}>{t("loading")}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.centerCard}>
              <Text style={styles.titleEmpty}>{t("noOffers")}</Text>
              <Text style={styles.muted}>{t("noOffersInFilter")}</Text>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 18 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {filtered.map((o) => {
              const email = o.profiles?.email ?? "user";
              const latestCounter = latestCounterByOfferId.get(o.id);

              const effectiveStatus: OfferStatus =
                o.status === "withdrawn"
                  ? "withdrawn"
                  : latestCounter?.status === "accepted"
                    ? "accepted"
                    : latestCounter?.status === "pending"
                      ? "pending"
                      : o.status;

              const isPending = effectiveStatus === "pending";
              const isAccepted = effectiveStatus === "accepted";
              const isWithdrawn = effectiveStatus === "withdrawn";

              return (
                <View key={o.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.seller}>{email}</Text>

                    <View
                      style={[
                        styles.statusPill,
                        isAccepted
                          ? styles.pillAccepted
                          : isWithdrawn
                            ? styles.pillWithdrawn
                            : effectiveStatus === "rejected"
                              ? styles.pillRejected
                              : styles.pillPending,
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {t(
                          effectiveStatus === "pending"
                            ? "pendingStatus"
                            : effectiveStatus === "accepted"
                              ? "acceptedStatus"
                              : effectiveStatus === "rejected"
                                ? "rejectedStatus"
                                : "withdrawnStatus",
                        )}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.price}>
                    {formatPrice(Number(o.price))}
                  </Text>
                  <Text style={styles.desc}>{o.description}</Text>

                  {(() => {
                    const slots = offerSlots.filter((s) => s.offer_id === o.id);
                    if (slots.length === 0) return null;
                    return (
                      <View style={styles.slotsWrap}>
                        <Text style={styles.slotsLabel}>
                          {t("scheduledSlots")}
                        </Text>
                        <View style={styles.slotsBox}>
                          {slots.map((s, i) => (
                            <View key={i} style={styles.slotChip}>
                              <Text style={styles.slotChipText}>
                                {t(DAY_KEYS[s.day_of_week])}{" "}
                                {formatTime(s.start_time)} –{" "}
                                {formatTime(s.end_time)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  })()}

                  {o.status === "withdrawn" && (
                    <View style={styles.counterBox}>
                      <Text style={styles.counterTitle}>
                        {t("offerWithdrawnTitle")}
                      </Text>
                      <Text style={styles.counterMsg}>
                        {t("offerWithdrawnMsg")}
                      </Text>
                    </View>
                  )}

                  {latestCounter && (
                    <View style={styles.counterBox}>
                      <Text style={styles.counterTitle}>
                        {t("counterOfferLabel")}:{" "}
                        {formatPrice(Number(latestCounter.price))}
                      </Text>
                      {!!latestCounter.message && (
                        <Text style={styles.counterMsg}>
                          {latestCounter.message}
                        </Text>
                      )}
                      <Text style={styles.counterStatus}>
                        {t("counterStatus")}:{" "}
                        {t(
                          latestCounter.status === "pending"
                            ? "pendingStatus"
                            : latestCounter.status === "accepted"
                              ? "acceptedStatus"
                              : latestCounter.status === "rejected"
                                ? "rejectedStatus"
                                : "withdrawnStatus",
                        )}
                      </Text>
                    </View>
                  )}

                  {/* Actions only if pending, not withdrawn, and no counter offer is awaiting seller response */}
                  {isPending &&
                    !isWithdrawn &&
                    latestCounter?.status !== "pending" && (
                      <View style={styles.actionsRow}>
                        <Pressable
                          onPress={() => openRejectMenu(o)}
                          style={[styles.btn, styles.btnSecondary]}
                        >
                          <Text style={styles.btnSecondaryText}>
                            {t("reject")}
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => acceptOffer(o.id)}
                          style={[styles.btn, styles.btnPrimary]}
                        >
                          <Text style={styles.btnPrimaryText}>
                            {t("accept")}
                          </Text>
                        </Pressable>
                      </View>
                    )}

                  {isAccepted && (
                    <View style={styles.actionsRow}>
                      <Pressable
                        onPress={openChat}
                        style={[styles.btn, styles.btnPrimary]}
                      >
                        <Text style={styles.btnPrimaryText}>{t("chat")}</Text>
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
