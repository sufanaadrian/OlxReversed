import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { useCurrency } from "../../src/context/CurrencyContext";
import { useTranslation } from "../../src/context/LanguageContext";
import { supabase } from "../../src/lib/supabase";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type SwipeDirection = "left" | "right";
type OfferStatus = "pending" | "accepted" | "rejected";
type OfferStatusDb = OfferStatus | "withdrawn";
type CounterStatus = "pending" | "accepted" | "rejected" | "withdrawn";

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
  status: OfferStatusDb;
  price: number;
  description: string;
  created_at: string;
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

export default function MyOffersScreen() {
  const t = useTranslation();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  type CombinedFilter =
    | "all"
    | "interested"
    | "skipped"
    | "active"
    | "withdrawn";

  const [filter, setFilter] = useState<CombinedFilter>("all");

  const [openThreads, setOpenThreads] = useState<Record<string, boolean>>({});
  const toggleThread = (requestId: string) => {
    setOpenThreads((prev) => ({ ...prev, [requestId]: !prev[requestId] }));
  };

  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});
  const toggleDetails = (requestId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenDetails((prev) => ({ ...prev, [requestId]: !prev[requestId] }));
  };

  const [swipes, setSwipes] = useState<
    { request: RequestRow; direction: SwipeDirection; swipedAt: string }[]
  >([]);

  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [counterOffers, setCounterOffers] = useState<CounterOfferRow[]>([]);

  // ✅ store the currently open row so we can close it
  const openRowRef = useRef<Swipeable | null>(null);

  const load = useCallback(async (showSpinner: boolean = true) => {
    if (showSpinner) setLoading(true);

    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;

    if (!uid) {
      setSwipes([]);
      setOffers([]);
      setCounterOffers([]);
      if (showSpinner) setLoading(false);
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
      Alert.alert(t("error"), swipeErr.message);
      if (showSpinner) setLoading(false);
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
      .filter(
        (
          x,
        ): x is {
          request: RequestRow;
          direction: SwipeDirection;
          swipedAt: string;
        } => x !== null,
      );

    setSwipes(normalizedSwipes);

    // 2) my offers (include withdrawn so you can filter them)
    const { data: offerData, error: offerErr } = await supabase
      .from("offers")
      .select("id,request_id,user_id,status,price,description,created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (offerErr) {
      Alert.alert(t("error"), offerErr.message);
      setOffers([]);
      if (showSpinner) setLoading(false);
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
      Alert.alert(t("error"), counterErr.message);
      setCounterOffers([]);
      if (showSpinner) setLoading(false);
      return;
    }

    setCounterOffers((counterData ?? []) as CounterOfferRow[]);

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

  const latestOfferByRequestId = useMemo(() => {
    const map = new Map<string, OfferRow>();
    for (const o of offers) {
      if (!map.has(o.request_id)) map.set(o.request_id, o);
    }
    return map;
  }, [offers]);

  const latestCounterByRequestId = useMemo(() => {
    const map = new Map<string, CounterOfferRow>();
    for (const c of counterOffers) {
      if (!map.has(c.request_id)) map.set(c.request_id, c);
    }
    return map;
  }, [counterOffers]);

  const offersByRequestId = useMemo(() => {
    const map = new Map<string, OfferRow[]>();
    for (const o of offers) {
      const arr = map.get(o.request_id) ?? [];
      arr.push(o);
      map.set(o.request_id, arr);
    }
    // newest first
    for (const [k, arr] of map) {
      arr.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      map.set(k, arr);
    }
    return map;
  }, [offers]);

  const countersByOfferId = useMemo(() => {
    const map = new Map<string, CounterOfferRow[]>();
    for (const c of counterOffers) {
      const arr = map.get(c.offer_id) ?? [];
      arr.push(c);
      map.set(c.offer_id, arr);
    }
    // newest first
    for (const [k, arr] of map) {
      arr.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      map.set(k, arr);
    }
    return map;
  }, [counterOffers]);

  const counts = useMemo(() => {
    const all = swipes.length;

    const interested = swipes.filter(({ request, direction }) => {
      if (direction !== "right") return false;
      const latestOffer = latestOfferByRequestId.get(request.id);
      return latestOffer == null; // ✅ only if no offer ever sent
    }).length;

    const skipped = swipes.filter((s) => s.direction === "left").length;

    return { all, interested, skipped };
  }, [swipes, latestOfferByRequestId]);

  const offerViewCounts = useMemo(() => {
    let active = 0;
    let withdrawn = 0;

    for (const { request } of swipes) {
      const latestOffer = latestOfferByRequestId.get(request.id);
      if (!latestOffer) continue;
      if (latestOffer.status === "withdrawn") withdrawn += 1;
      else active += 1;
    }

    return { active, withdrawn };
  }, [swipes, latestOfferByRequestId]);

  const visibleBySwipe = useMemo(() => {
    if (filter === "all") return swipes;

    if (filter === "interested") {
      return swipes.filter(({ request, direction }) => {
        if (direction !== "right") return false;
        const latestOffer = latestOfferByRequestId.get(request.id);
        return latestOffer == null; // ✅ same rule as the count
      });
    }

    return swipes.filter((s) => s.direction === "left");
  }, [swipes, filter, latestOfferByRequestId]);

  const visible = useMemo(() => {
    // start from all swipes
    let base = swipes;

    // 1) swipe-based filters
    if (filter === "interested") {
      base = base.filter(({ request, direction }) => {
        if (direction !== "right") return false;
        const latestOffer = latestOfferByRequestId.get(request.id);
        return latestOffer == null; // <-- key change: no offer ever sent
      });
    }

    if (filter === "skipped") base = base.filter((s) => s.direction === "left");

    // 2) offer-based filters (needs latestOfferByRequestId)
    if (filter === "withdrawn") {
      base = base.filter(({ request }) => {
        const latestOffer = latestOfferByRequestId.get(request.id);
        return latestOffer?.status === "withdrawn";
      });
    }

    if (filter === "active") {
      base = base.filter(({ request }) => {
        const latestOffer = latestOfferByRequestId.get(request.id);
        return latestOffer != null && latestOffer.status !== "withdrawn";
      });
    }

    return base;
  }, [swipes, filter, latestOfferByRequestId]);

  const openCreateOffer = (requestId: string) => {
    router.push({
      pathname: "/(modals)/create-offer",
      params: { requestId },
    } as any);
  };

  const openEditOffer = (offer: OfferRow) => {
    // close open swipe row so the UI doesn’t stay stuck
    openRowRef.current?.close();

    router.push({
      pathname: "/(modals)/edit-offer",
      params: {
        offerId: offer.id,
        requestId: offer.request_id,
        price: String(offer.price),
        description: offer.description ?? "",
      },
    } as any);
  };

  const openChat = (requestId: string) => {
    router.push({
      pathname: "/request/[id]/chat",
      params: { id: requestId },
    } as any);
  };

  const acceptCounter = async (counter: CounterOfferRow) => {
    const { error: cErr } = await supabase
      .from("counter_offers")
      .update({ status: "accepted" })
      .eq("id", counter.id);

    if (cErr) return Alert.alert(t("error"), cErr.message);

    const { error: oErr } = await supabase
      .from("offers")
      .update({ status: "accepted" }) // (and don't overwrite price if you want Vinted-style)
      .eq("id", counter.offer_id);

    if (oErr) return Alert.alert(t("error"), oErr.message);

    // ✅ THIS IS THE MISSING PIECE
    const { error: rErr } = await supabase
      .from("requests")
      .update({ status: "matched" })
      .eq("id", counter.request_id);

    if (rErr) {
      Alert.alert(
        t("requestNotUpdated"),
        `Counter accepted, but request stayed OPEN.\nReason: ${rErr.message}`,
      );
      return load(false);
    }

    Alert.alert(t("accepted"), t("counterAcceptedText"));
    load(false);
  };

  const rejectCounter = async (counter: CounterOfferRow) => {
    const { error } = await supabase
      .from("counter_offers")
      .update({ status: "rejected" })
      .eq("id", counter.id);

    if (error) return Alert.alert(t("error"), error.message);

    load(false);
  };

  const confirmWithdraw = (offerId: string) => {
    Alert.alert(t("withdrawOfferConfirm"), t("withdrawOfferMsg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("withdrawOffer"),
        style: "destructive",
        onPress: () => withdrawOffer(offerId),
      },
    ]);
  };

  const withdrawOffer = async (offerId: string) => {
    // close open swipe row
    openRowRef.current?.close();

    // ✅ use select so we KNOW it updated (debug-friendly)
    const { data, error } = await supabase
      .from("offers")
      .update({ status: "withdrawn" })
      .eq("id", offerId)
      .select("id,status");

    if (error) return Alert.alert(t("error"), error.message);

    if (!data || data.length === 0) {
      Alert.alert(t("notUpdated"), t("noRowsUpdated"));
      return;
    }

    Alert.alert(t("offerWithdrawn"), t("yourOfferWithdrawn"));
    load(false);
  };

  // ✅ NEW: right actions now have 2 buttons (Edit + Withdraw)
  const renderRightActions = (offer: OfferRow) => {
    return (
      <View style={styles.rightActionsWrap}>
        <Pressable
          onPress={() => openEditOffer(offer)}
          style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.9 }]}
        >
          <Feather name="edit-2" size={18} color="white" />
          <Text style={styles.actionText}>{t("edit")}</Text>
        </Pressable>

        <Pressable
          onPress={() => confirmWithdraw(offer.id)}
          style={({ pressed }) => [
            styles.withdrawBtn,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Feather name="trash-2" size={18} color="white" />
          <Text style={styles.actionText}>{t("withdrawOffer")}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.h1}>{t("myOffers")}</Text>
      </View>
      {/* ✅ single combined filter row */}
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
            label={`${t("interested")} (${counts.interested})`}
            active={filter === "interested"}
            onPress={() => setFilter("interested")}
          />

          <FilterBtn
            label={`${t("active")} (${offerViewCounts.active})`}
            active={filter === "active"}
            onPress={() => setFilter("active")}
          />

          <FilterBtn
            label={`${t("skipped")} (${counts.skipped})`}
            active={filter === "skipped"}
            onPress={() => setFilter("skipped")}
          />

          <FilterBtn
            label={`${t("offerWithdrawn")} (${offerViewCounts.withdrawn})`}
            active={filter === "withdrawn"}
            onPress={() => setFilter("withdrawn")}
          />
        </ScrollView>
        {/* scroll hint */}
        <View pointerEvents="none" style={styles.scrollHint}>
          <Text style={styles.scrollHintArrow}>›</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerCard}>
          <Text style={styles.centerTitle}>{t("loading")}</Text>
          <Text style={styles.centerSub}>{t("fetchingSwipesOffers")}</Text>
        </View>
      ) : visible.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.centerCard}>
            <Text style={styles.centerTitle}>{t("noOffers")}</Text>
            <Text style={styles.centerSub}>{t("noItemsInFilter")}</Text>
            <Pressable
              style={styles.btnPrimary}
              onPress={() => router.push("/(tabs)/marketplace" as any)}
            >
              <Text style={styles.btnPrimaryText}>{t("goToMarketplace")}</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 18 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {visible.map(({ request, direction }) => {
            const latestOffer = latestOfferByRequestId.get(request.id);
            const counter = latestCounterByRequestId.get(request.id);

            const requestOffers = offersByRequestId.get(request.id) ?? [];
            const isThreadOpen = openThreads[request.id] !== false;

            // Map "withdrawn" to "none" to satisfy the type constraint
            const offerState: OfferStatus | "none" =
              latestOffer?.status === "withdrawn"
                ? "none"
                : ((latestOffer?.status as OfferStatus) ?? "none");

            const counterPending = counter?.status === "pending";
            const counterAccepted = counter?.status === "accepted";

            let effectiveState:
              | "none"
              | OfferStatus
              | "counter_pending"
              | "counter_accepted" = offerState;

            if (counterPending) effectiveState = "counter_pending";
            if (counterAccepted) effectiveState = "counter_accepted";

            const canSendOffer =
              direction === "right" &&
              !counterPending &&
              !counterAccepted &&
              (offerState === "none" || offerState === "rejected");

            // ✅ allow edit/withdraw only if not accepted and not withdrawn
            const canEditOrWithdraw =
              !!latestOffer &&
              latestOffer.status !== "accepted" &&
              latestOffer.status !== "withdrawn";

            // ✅ each row needs its own ref so openRowRef works
            const rowRef = React.createRef<Swipeable>();
            const isDetailsOpen = openDetails[request.id] === true;

            return (
              <Swipeable
                key={request.id}
                ref={rowRef}
                renderRightActions={() =>
                  canEditOrWithdraw && latestOffer
                    ? renderRightActions(latestOffer)
                    : null
                }
                overshootRight={false}
                onSwipeableWillOpen={() => {
                  if (
                    openRowRef.current &&
                    openRowRef.current !== rowRef.current
                  ) {
                    openRowRef.current.close();
                  }
                }}
                onSwipeableOpen={() => {
                  openRowRef.current = rowRef.current;
                }}
              >
                <View style={styles.card}>
                  <Pressable
                    onPress={() => toggleDetails(request.id)}
                    style={styles.cardTop}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.category}>{request.category}</Text>
                      <Text
                        style={styles.title}
                        numberOfLines={isDetailsOpen ? 0 : 1}
                      >
                        {request.title}
                      </Text>
                      <Text style={styles.by} numberOfLines={1}>
                        {t("postedBy")} {request.profiles?.email ?? "unknown"}
                      </Text>
                    </View>
                    <Feather
                      name={isDetailsOpen ? "chevron-up" : "chevron-down"}
                      size={18}
                      color="#6B7280"
                    />
                  </Pressable>

                  <Text
                    style={styles.desc}
                    numberOfLines={isDetailsOpen ? 0 : 2}
                  >
                    {request.description}
                  </Text>

                  {isDetailsOpen && !!request.location && (
                    <Text style={styles.detailLocation}>
                      📍 {request.location}
                    </Text>
                  )}

                  {isDetailsOpen && (
                    <View style={styles.detailActionsRow}>
                      <Pressable
                        style={styles.detailActionBtn}
                        onPress={() =>
                          router.push(`/request/${request.id}` as any)
                        }
                      >
                        <Text style={styles.detailActionBtnText}>
                          {t("openRequestPage")}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[styles.detailActionBtn, styles.detailActionBtnSecondary]}
                        onPress={() => toggleDetails(request.id)}
                      >
                        <Text
                          style={[
                            styles.detailActionBtnText,
                            styles.detailActionBtnSecondaryText,
                          ]}
                        >
                          {t("collapse")}
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  <View style={styles.metaRow}>
                    <View style={styles.pill}>
                      <Text style={styles.pillText}>
                        {formatPrice(request.budget_min)} -{" "}
                        {formatPrice(request.budget_max)}
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
                        {direction === "right" ? t("interested") : t("skipped")}
                      </Text>
                    </View>
                  </View>
                  {requestOffers.length > 0 && (
                    <View style={styles.threadHeader}>
                      <Pressable
                        style={styles.btnSecondary}
                        onPress={() => toggleThread(request.id)}
                      >
                        <Text style={styles.threadToggleText}>
                          {isThreadOpen
                            ? t("hideNegotiation")
                            : `${t("showNegotiation")} (${requestOffers.length})`}
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  {isThreadOpen && requestOffers.length > 0 && (
                    <View style={styles.threadWrap}>
                      <Text style={styles.threadTitle}>{t("negotiation")}</Text>

                      {requestOffers.map((o, idx) => {
                        const counters = countersByOfferId.get(o.id) ?? [];
                        const acceptedCounter =
                          counters.find((x) => x.status === "accepted") ?? null; // OK even newest-first

                        const isLatest = idx === 0;

                        return (
                          <View
                            key={o.id}
                            style={[
                              styles.threadNode,
                              isLatest && styles.threadNodeLatest,
                            ]}
                          >
                            {isLatest && (
                              <View style={styles.currentBadge}>
                                <Text style={styles.currentBadgeText}>
                                  {t("current")}
                                </Text>
                              </View>
                            )}

                            <View style={styles.offerHeaderRow}>
                              {acceptedCounter ? (
                                // Vinted style (only when counter accepted)
                                <View style={styles.offerCompareRow}>
                                  <Text style={styles.oldOfferText}>
                                    {formatPrice(Number(o.price))} •
                                    {t("rejected")}
                                  </Text>

                                  <Text style={styles.arrowText}>→</Text>

                                  <Text style={styles.newOfferText}>
                                    {formatPrice(Number(acceptedCounter.price))}{" "}
                                    • {t("accepted")}
                                  </Text>
                                </View>
                              ) : (
                                // Normal style (always show status)
                                <Text
                                  style={[
                                    styles.offerMain,
                                    (o.status === "rejected" ||
                                      o.status === "withdrawn") &&
                                      styles.offerMainBad,
                                    o.status === "accepted" &&
                                      styles.offerMainGood,
                                  ]}
                                >
                                  {formatPrice(Number(o.price))} •{" "}
                                  {t(
                                    o.status === "pending"
                                      ? "pendingStatus"
                                      : o.status === "accepted"
                                        ? "acceptedStatus"
                                        : o.status === "rejected"
                                          ? "rejectedStatus"
                                          : "withdrawnStatus",
                                  )}
                                </Text>
                              )}

                              <Text style={styles.offerMeta}>
                                {new Date(o.created_at).toLocaleString()}
                              </Text>
                            </View>

                            {counters.map((c) => {
                              const counterPending = c.status === "pending";

                              return (
                                <View key={c.id} style={styles.counterNode}>
                                  <Text style={styles.counterMain}>
                                    ↳ {request.profiles?.email ?? "unknown"}{" "}
                                    {t("counterOfferFrom")}:{" "}
                                    {formatPrice(Number(c.price))}
                                  </Text>

                                  {!!c.message && (
                                    <Text
                                      style={styles.counterMsg}
                                      numberOfLines={3}
                                    >
                                      {c.message}
                                    </Text>
                                  )}

                                  <Text style={styles.counterMeta}>
                                    <Text
                                      style={{
                                        fontWeight: "900",
                                        color:
                                          o.status === "rejected"
                                            ? "#dc2626" // red
                                            : o.status === "withdrawn"
                                              ? "#dc2626" // red for withdrawn too (optional)
                                              : "#16a34a", // green for accepted / pending
                                      }}
                                    >
                                      {t(
                                        c.status === "pending"
                                          ? "pendingStatus"
                                          : c.status === "accepted"
                                            ? "acceptedStatus"
                                            : c.status === "rejected"
                                              ? "rejectedStatus"
                                              : "withdrawnStatus",
                                      )}{" "}
                                      •{" "}
                                    </Text>
                                    {new Date(c.created_at).toLocaleString()}
                                  </Text>

                                  {isLatest && counterPending && (
                                    <View style={styles.counterActions}>
                                      <Pressable
                                        style={styles.btnPrimary}
                                        onPress={() => acceptCounter(c)}
                                      >
                                        <Text style={styles.btnPrimaryText}>
                                          {t("acceptCounter")}
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        style={styles.btnSecondary}
                                        onPress={() => rejectCounter(c)}
                                      >
                                        <Text style={styles.btnSecondaryText}>
                                          {t("reject")}
                                        </Text>
                                      </Pressable>
                                    </View>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        );
                      })}
                    </View>
                  )}

                  <View style={styles.statusRow}>
                    {effectiveState === "none" && (
                      <View style={[styles.statusPill, styles.statusNone]}>
                        <Text style={styles.statusText}>{t("noOfferYet")}</Text>
                      </View>
                    )}
                    {effectiveState === "pending" && (
                      <View style={[styles.statusPill, styles.statusPending]}>
                        <Text style={styles.statusText}>
                          {t("offerPending")}
                        </Text>
                      </View>
                    )}
                    {effectiveState === "accepted" && (
                      <View style={[styles.statusPill, styles.statusAccepted]}>
                        <Text style={styles.statusText}>{t("accepted")}</Text>
                      </View>
                    )}
                    {effectiveState === "rejected" && (
                      <View style={[styles.statusPill, styles.statusRejected]}>
                        <Text style={styles.statusText}>
                          {t("rejectedCanResend")}
                        </Text>
                      </View>
                    )}
                    {effectiveState === "counter_pending" && (
                      <View style={[styles.statusPill, styles.statusPending]}>
                        <Text style={styles.statusText}>
                          {t("counterOfferPending")}
                        </Text>
                      </View>
                    )}
                    {effectiveState === "counter_accepted" && (
                      <View style={[styles.statusPill, styles.statusAccepted]}>
                        <Text style={styles.statusText}>
                          {t("counterOfferAccepted")}
                        </Text>
                      </View>
                    )}
                    {(effectiveState as string) === "withdrawn" && (
                      <View style={[styles.statusPill, styles.statusWithdrawn]}>
                        <Text style={styles.statusText}>
                          {t("offerWithdrawn")}
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
                            ? t("sendNewOffer")
                            : t("sendOffer")}
                        </Text>
                      </Pressable>
                    )}

                    {counterPending && (
                      <Text style={styles.skippedHint}>
                        {t("counterOfferPendingHint")}
                      </Text>
                    )}

                    {(offerState === "accepted" || counterAccepted) && (
                      <Pressable
                        style={styles.btnPrimary}
                        onPress={() => openChat(request.id)}
                      >
                        <Text style={styles.btnPrimaryText}>{t("chat")}</Text>
                      </Pressable>
                    )}

                    {direction === "left" && (
                      <Text style={styles.skippedHint}>
                        {t("skippedItemsReadOnly")}
                      </Text>
                    )}
                  </View>
                </View>
              </Swipeable>
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

  filtersWrap: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 6,
    marginBottom: 6,
    overflow: "hidden", // 🔑 clips scrolling content
  },
  filters: {
    flexDirection: "row",
    gap: 6,
    paddingRight: 20, // 👈 keeps last pill visible
  },
  scrollHint: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)", // adjust to theme
  },

  scrollHintArrow: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.secondaryText,
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
    marginTop: 12,
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

  myOfferBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  myOfferTitle: { fontWeight: "900", color: theme.primaryText },
  myOfferDesc: { marginTop: 4, color: theme.secondaryText, fontWeight: "700" },
  myOfferMeta: {
    marginTop: 6,
    color: theme.secondaryText,
    fontWeight: "700",
    fontSize: 12,
  },

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
  counterStatus: {
    fontWeight: "900",
    color: theme.secondaryText,
    fontSize: 12,
  },

  statusRow: { marginTop: 12 },
  statusPill: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 14 },
  statusNone: { backgroundColor: theme.border },
  statusPending: { backgroundColor: theme.accentSoft },
  statusAccepted: { backgroundColor: theme.successSoft },
  statusRejected: { backgroundColor: theme.dangerSoft },
  statusWithdrawn: { backgroundColor: theme.dangerSoft },

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

  // ✅ UPDATED: space for 2 buttons
  rightActionsWrap: {
    width: 210,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingRight: 6,
  },
  editBtn: {
    width: 95,
    height: "100%",
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  withdrawBtn: {
    width: 105,
    height: "100%",
    borderRadius: 18,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  actionText: { color: "white", fontWeight: "900", fontSize: 12 },

  threadHeader: { marginTop: 10 },
  threadToggle: { paddingVertical: 6 },
  threadToggleText: { fontWeight: "900", color: theme.primaryText },

  threadWrap: { marginTop: 10, gap: 10 },
  threadTitle: { fontWeight: "900", color: theme.primaryText },

  threadNode: {
    borderLeftWidth: 3,
    borderLeftColor: theme.border,
    paddingLeft: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.bg,
  },

  offerRow: { gap: 2 },
  offerMain: { fontWeight: "900", color: theme.primaryText },
  offerMeta: { fontSize: 12, color: theme.secondaryText, fontWeight: "700" },
  offerDesc: {
    marginTop: 6,
    marginBottom: 6,
    color: theme.secondaryText,
    lineHeight: 18,
  },

  counterNode: {
    marginTop: 10,
    marginLeft: 6,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    gap: 4,
  },

  threadNodeLatest: {
    borderLeftColor: theme.primary,
    backgroundColor: "#f0f9ff",
  },

  currentBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 4,
  },

  currentBadgeText: {
    color: "white",
    fontWeight: "900",
    fontSize: 10,
  },
  offerHeaderRow: { gap: 6 },
  offerCompareRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  offerMainGood: { color: "#16a34a" },
  offerMainBad: { color: "#dc2626" },

  oldOfferText: {
    fontWeight: "900",
    color: "#dc2626",
    textDecorationLine: "line-through",
  },
  arrowText: { fontWeight: "900", color: theme.secondaryText },
  newOfferText: { fontWeight: "900", color: "#16a34a" },

  counterMain: { fontWeight: "900", color: theme.primaryText },
  counterMsg: { color: theme.secondaryText, lineHeight: 18 },
  counterMeta: { fontSize: 12, color: theme.secondaryText, fontWeight: "700" },
  counterActions: { flexDirection: "row", gap: 10, marginTop: 8 },

  detailLocation: {
    marginTop: 8,
    color: theme.secondaryText,
    fontWeight: "700",
    fontSize: 13,
  },

  detailActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  detailActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#111827",
  },

  detailActionBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },

  detailActionBtnSecondary: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },

  detailActionBtnSecondaryText: {
    color: theme.primaryText,
  },
});
