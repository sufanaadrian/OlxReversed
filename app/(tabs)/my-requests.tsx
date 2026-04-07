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
    Text,
    View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { useCurrency } from "../../src/context/CurrencyContext";
import { useTranslation } from "../../src/context/LanguageContext";
import { supabase } from "../../src/lib/supabase";
import { styles } from "./my-requests.styles";

type Filter = "all" | "active" | "matched" | "closed";

const categoryTranslationKeys: Record<string, string> = {
  Vehicles: "vehicles",
  "Real Estate": "realEstate",
  Services: "services",
  "Electronics & Tech": "electronics",
  "Fashion & Personal": "fashion",
  Other: "other",
  All: "all",
};

function getStatusLabel(t: any, status: "active" | "matched" | "closed") {
  switch (status) {
    case "active":
      return t("open");
    case "matched":
      return t("negotiating");
    case "closed":
      return t("closed");
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
  const t = useTranslation();
  const { formatPrice } = useCurrency();
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
      Alert.alert(t("error"), reqErr.message);
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
    Alert.alert(t("deleteRequestConfirm"), t("deleteRequestMsg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () => deleteRequest(req),
      },
    ]);
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
      Alert.alert(t("error"), error.message);
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
          <Text style={styles.deleteText}>{t("delete")}</Text>
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
            <Text style={styles.categoryPill}>
              {t(categoryTranslationKeys[item.category] || "other")}
            </Text>

            <View style={styles.rightBadges}>
              {offerCounts.total > 0 && (
                <View style={styles.offerPill}>
                  <Text style={styles.offerPillText}>
                    {offerCounts.total}{" "}
                    {offerCounts.total === 1 ? t("offer") : t("offers")}
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
                  {getStatusLabel(t, item.status)}
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
              {formatPrice(item.budget_min)} – {formatPrice(item.budget_max)}
            </Text>
            {!!item.location && (
              <Text style={styles.metaMuted}>• {item.location}</Text>
            )}
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.smallMuted}>
              {t("postedAt")} {new Date(item.created_at).toLocaleString()}
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
                <Text style={styles.reviewBtnText}>{t("chat")}</Text>
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
                  {t("review")} ({offerCounts.pending})
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
                  {t("counterPending")} ({counterCounts.pending})
                </Text>
              </Pressable>
            ) : hasWithdrawnOffers ? (
              <Text style={styles.smallMuted}>
                {t("withdrawnOffers")} ({offerCounts.withdrawn})
              </Text>
            ) : (
              <Text style={styles.smallMuted}>
                {offerCounts.total === 0
                  ? t("noOffersYet")
                  : t("noPendingOffers")}
              </Text>
            )}
          </View>
        </Pressable>
      </Swipeable>
    );
  };

  const ListEmpty = (
    <View style={styles.centerCard}>
      <Text style={styles.titleEmpty}>{t("nothingHere")}</Text>
      <Text style={styles.muted}>{t("createARequest")}</Text>
    </View>
  );

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>{t("myRequests")}</Text>

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
            label={`${t("all")} (${counts.all})`}
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />

          <FilterBtn
            label={`${t("open")} (${counts.active})`}
            active={filter === "active"}
            onPress={() => setFilter("active")}
          />

          <FilterBtn
            label={`${t("negotiating")} (${counts.matched})`}
            active={filter === "matched"}
            onPress={() => setFilter("matched")}
          />

          <FilterBtn
            label={`${t("closed")} (${counts.closed})`}
            active={filter === "closed"}
            onPress={() => setFilter("closed")}
          />
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerCard}>
          <Text style={styles.muted}>{t("loadingEllipsis")}</Text>
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
