import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { ImageViewer } from "../../src/components/ImageViewer";
import {
    SchedulePicker,
    WeekSchedule,
    emptyWeek,
} from "../../src/components/SchedulePicker";
import { useCurrency } from "../../src/context/CurrencyContext";
import { useTranslation } from "../../src/context/LanguageContext";
import { supabase } from "../../src/lib/supabase";
import { styles, theme } from "./my-requests.styles";

type Filter = "all" | "active" | "matched" | "closed";

const budgetTypeKeys: Record<string, string> = {
  per_hour: "budgetPerHour",
  per_day: "budgetPerDay",
  fixed: "budgetFixed",
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
  budget_min: number | null;
  budget_max: number | null;
  location: string | null;
  status: "active" | "matched" | "closed";
  created_at: string;
  open_budget: boolean | null;
  posting_as: string | null;
  budget_type: string | null;
  timeline: string | null;
  work_mode: string | null;
  experience_level: string | null;
  photos: string[] | null;
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
  const [isGuest, setIsGuest] = useState(false);

  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [countsByRequestId, setCountsByRequestId] = useState<
    Map<string, OfferCounts>
  >(new Map());
  const [counterCountsByRequestId, setCounterCountsByRequestId] = useState<
    Map<string, CounterCounts>
  >(new Map());
  const [filter, setFilter] = useState<Filter>("all");
  const [availabilityMap, setAvailabilityMap] = useState<
    Map<string, WeekSchedule>
  >(new Map());

  const openRowRef = useRef<Swipeable | null>(null);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerVisible, setViewerVisible] = useState(false);

  const load = useCallback(
    async (showSpinner: boolean = true) => {
      if (showSpinner) setLoading(true);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;

      if (!user) {
        setIsGuest(true);
        setRequests([]);
        setCountsByRequestId(new Map());
        setCounterCountsByRequestId(new Map());
        if (showSpinner) setLoading(false);
        return;
      }
      setIsGuest(false);

      const { data: reqs, error: reqErr } = await supabase
        .from("requests")
        .select(
          "id,user_id,title,description,category,budget_min,budget_max,location,status,created_at,open_budget,posting_as,budget_type,timeline,work_mode,experience_level,photos",
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

      // Load availability for all requests
      const { data: avail } = await supabase
        .from("request_availability")
        .select("id,request_id,day_of_week,start_time,end_time,is_booked,date")
        .in("request_id", ids)
        .order("day_of_week")
        .order("start_time");

      const availMap = new Map<string, WeekSchedule>();
      (avail ?? []).forEach((row: any) => {
        if (!availMap.has(row.request_id))
          availMap.set(row.request_id, emptyWeek());
        const week = availMap.get(row.request_id)!;
        const day = week[row.day_of_week];
        day.enabled = true;
        day.slots.push({
          id: row.id,
          start: row.start_time.slice(0, 5),
          end: row.end_time.slice(0, 5),
          date: row.date ?? undefined,
        });
      });
      setAvailabilityMap(availMap);

      if (showSpinner) setLoading(false);
    },
    [t],
  );

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
  const openEditRequest = (req: RequestRow) => {
    openRowRef.current?.close();
    router.push({
      pathname: "/(modals)/create-request",
      params: { requestId: req.id },
    } as any);
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
        </Pressable>
        <Pressable
          onPress={() => openEditRequest(req)}
          style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.9 }]}
        >
          <Feather name="edit-2" size={18} color="white" />
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
    const firstPhoto =
      item.photos && item.photos.length > 0 ? item.photos[0] : null;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
        onSwipeableWillOpen={() => {
          if (openRowRef.current) openRowRef.current.close();
        }}
        onSwipeableOpen={(direction, swipeable) => {
          openRowRef.current = swipeable;
        }}
      >
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/request/[id]",
              params: { id: item.id },
            } as any)
          }
          style={styles.card}
        >
          <View style={styles.cardInner}>
            {/* Thumbnail */}
            {firstPhoto && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setViewerImages(item.photos ?? []);
                  setViewerVisible(true);
                }}
              >
                <Image
                  source={{ uri: firstPhoto }}
                  style={styles.cardThumb}
                  resizeMode="cover"
                />
              </Pressable>
            )}

            <View style={styles.cardContent}>
              {/* Top row: posted-as + status */}
              <View style={styles.topRow}>
                {item.posting_as === "offering" ? (
                  <View style={styles.offeringTag}>
                    <Text style={styles.offeringTagText}>
                      {t("postingOffering")}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.seekingTag}>
                    <Text style={styles.seekingTagText}>
                      {t("postingSeeking")}
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

              {/* Title */}
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>

              {/* Budget */}
              <View style={styles.metaRow}>
                <Feather
                  name="dollar-sign"
                  size={13}
                  color={theme.secondaryText}
                />
                <Text style={styles.metaStrong}>
                  {item.open_budget
                    ? t("openBudget")
                    : item.budget_type &&
                        item.budget_type !== "range" &&
                        budgetTypeKeys[item.budget_type]
                      ? `${formatPrice(item.budget_min ?? 0)} ${t(budgetTypeKeys[item.budget_type])}`
                      : `${formatPrice(item.budget_min ?? 0)} – ${formatPrice(item.budget_max ?? 0)}`}
                </Text>
                {!!item.location && (
                  <>
                    <Feather
                      name="map-pin"
                      size={13}
                      color={theme.secondaryText}
                    />
                    <Text style={styles.metaMuted} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Availability */}
          {availabilityMap.has(item.id) && (
            <View style={styles.availWrap}>
              <SchedulePicker value={availabilityMap.get(item.id)!} readOnly />
            </View>
          )}

          {/* Footer: offers info + action */}
          <View style={styles.footerRow}>
            {offerCounts.total > 0 && (
              <View style={styles.offerPill}>
                <Text style={styles.offerPillText}>
                  {offerCounts.total}{" "}
                  {offerCounts.total === 1 ? t("offer") : t("offers")}
                </Text>
              </View>
            )}

            <View style={{ flex: 1 }} />

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
              <View style={styles.reviewBtn}>
                <Text style={styles.reviewBtnText}>
                  {t("review")} ({offerCounts.pending})
                </Text>
              </View>
            ) : hasPendingCounters ? (
              <View style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>
                  {t("counterPending")} ({counterCounts.pending})
                </Text>
              </View>
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

  const ListEmpty = isGuest ? (
    <View style={styles.centerCard}>
      <Text style={styles.titleEmpty}>{t("signInRequired")}</Text>
      <Text style={styles.muted}>{t("pleaseSignIn")}</Text>
      <Pressable
        onPress={() => router.push("/sign-in" as any)}
        style={[styles.filterBtn, styles.filterBtnActive]}
      >
        <Text style={[styles.filterText, styles.filterTextActive]}>
          {t("signIn")}
        </Text>
      </Pressable>
    </View>
  ) : (
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

      {/* Fullscreen image viewer */}
      <ImageViewer
        images={viewerImages}
        visible={viewerVisible}
        initialIndex={0}
        onClose={() => setViewerVisible(false)}
      />
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
