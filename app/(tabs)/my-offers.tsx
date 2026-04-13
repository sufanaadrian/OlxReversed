import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  UIManager,
  View,
} from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { ImageViewer } from "../../src/components/ImageViewer";
import { useCurrency } from "../../src/context/CurrencyContext";
import { useTranslation } from "../../src/context/LanguageContext";
import { supabase } from "../../src/lib/supabase";
import { styles } from "./my-offers.styles";

const scheduleKeys: Record<string, string> = {
  anytime: "scheduleAnytime",
  weekdays: "scheduleWeekdays",
  weekends: "scheduleWeekends",
  specific_date: "scheduleSpecificDate",
};

const durationKeys: Record<string, string> = {
  few_hours: "durationHours",
  full_day: "durationDay",
  multi_day: "durationMultiDay",
  recurring: "durationRecurring",
};

const workModeKeys: Record<string, string> = {
  onsite: "workOnsite",
  remote: "workRemote",
  hybrid: "workHybrid",
};

const experienceKeys: Record<string, string> = {
  any: "experienceAny",
  beginner: "experienceBeginner",
  experienced: "experienceExperienced",
  expert: "experienceExpert",
};

const equipmentKeys: Record<string, string> = {
  not_needed: "equipmentNotNeeded",
  pro_provides: "equipmentPro",
  client_provides: "equipmentClient",
};

const postingAsKeys: Record<string, string> = {
  seeking: "postingSeeking",
  offering: "postingOffering",
};

const budgetTypeKeys: Record<string, string> = {
  per_hour: "budgetPerHour",
  per_day: "budgetPerDay",
  fixed: "budgetFixed",
};

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
  open_budget: boolean | null;
  posting_as: string | null;
  budget_type: string | null;
  timeline: string | null;
  duration: string | null;
  workers_needed: number | null;
  work_mode: string | null;
  experience_level: string | null;
  equipment: string | null;
  preferred_schedule: string | null;
  scheduled_date: string | null;
  special_requirements: string | null;
  photos: string[] | null;
  profiles?: { display_name: string | null } | null;
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
  const [isGuest, setIsGuest] = useState(false);

  type CombinedFilter =
    | "all"
    | "interested"
    | "skipped"
    | "active"
    | "withdrawn";

  const [filter, setFilter] = useState<CombinedFilter>("all");

  const [openThreads, setOpenThreads] = useState<Record<string, boolean>>({});
  const [openOlderThreads, setOpenOlderThreads] = useState<
    Record<string, boolean>
  >({});
  const toggleThread = (requestId: string) => {
    setOpenThreads((prev) => ({ ...prev, [requestId]: !prev[requestId] }));
  };
  const toggleOlderThread = (requestId: string) => {
    setOpenOlderThreads((prev) => ({ ...prev, [requestId]: !prev[requestId] }));
  };

  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);

  const openViewer = (images: string[], index: number) => {
    setViewerImages(images);
    setViewerIndex(index);
    setViewerVisible(true);
  };

  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});
  const toggleDetails = (requestId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenDetails((prev) => ({ ...prev, [requestId]: !prev[requestId] }));
  };

  const [expandedOfferDesc, setExpandedOfferDesc] = useState<
    Record<string, boolean>
  >({});
  const toggleOfferDesc = (offerId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedOfferDesc((prev) => ({ ...prev, [offerId]: !prev[offerId] }));
  };

  const [swipes, setSwipes] = useState<
    { request: RequestRow; direction: SwipeDirection; swipedAt: string }[]
  >([]);

  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [counterOffers, setCounterOffers] = useState<CounterOfferRow[]>([]);

  // ✅ store the currently open row so we can close it
  const openRowRef = useRef<SwipeableMethods | null>(null);

  const load = useCallback(
    async (showSpinner: boolean = true) => {
      if (showSpinner) setLoading(true);

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;

      if (!uid) {
        setIsGuest(true);
        setSwipes([]);
        setOffers([]);
        setCounterOffers([]);
        if (showSpinner) setLoading(false);
        return;
      }
      setIsGuest(false);

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
          open_budget,
          posting_as,
          budget_type,
          timeline,
          preferred_schedule,
          duration,
          workers_needed,
          work_mode,
          experience_level,
          equipment,
          scheduled_date,
          special_requirements,
          photos,
          profiles!requests_user_id_fkey ( display_name )
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

    // 3) Smart sort: priority tier + latest activity
    const getTier = (item: (typeof swipes)[0]): number => {
      const { request, direction } = item;
      const latestOffer = latestOfferByRequestId.get(request.id);
      const counter = latestCounterByRequestId.get(request.id);

      // Counter-offer pending your response → top priority
      if (counter?.status === "pending") return 1;
      // Offer pending → waiting for buyer
      if (latestOffer && latestOffer.status === "pending") return 2;
      // Matched/accepted
      if (latestOffer?.status === "accepted" || counter?.status === "accepted")
        return 3;
      // Interested but no offer yet
      if (direction === "right" && !latestOffer) return 4;
      // Rejected — can resend
      if (latestOffer?.status === "rejected") return 5;
      // Withdrawn
      if (latestOffer?.status === "withdrawn") return 6;
      // Skipped
      if (direction === "left") return 7;
      return 8;
    };

    const getLatestActivityTs = (item: (typeof swipes)[0]): number => {
      const reqOffers = offersByRequestId.get(item.request.id) ?? [];
      let latest = new Date(item.swipedAt).getTime();
      for (const o of reqOffers) {
        const t = new Date(o.created_at).getTime();
        if (t > latest) latest = t;
        const cs = countersByOfferId.get(o.id) ?? [];
        for (const c of cs) {
          const ct = new Date(c.created_at).getTime();
          if (ct > latest) latest = ct;
        }
      }
      return latest;
    };

    const getSectionKey = (tier: number): string => {
      switch (tier) {
        case 1:
          return "sectionNeedsResponse";
        case 2:
          return "sectionWaiting";
        case 3:
          return "sectionCompleted";
        case 4:
          return "sectionInterested";
        case 5:
          return "sectionRejected";
        case 6:
          return "sectionWithdrawn";
        case 7:
          return "sectionSkipped";
        default:
          return "sectionSkipped";
      }
    };

    const decorated = base.map((item) => {
      const tier = getTier(item);
      const latestActivityTs = getLatestActivityTs(item);
      return { item, tier, latestActivityTs };
    });

    const sorted = decorated.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return b.latestActivityTs - a.latestActivityTs;
    });

    return sorted.map(({ item, tier }) => {
      return { ...item, sectionKey: getSectionKey(tier) };
    });
  }, [
    swipes,
    filter,
    latestOfferByRequestId,
    latestCounterByRequestId,
    offersByRequestId,
    countersByOfferId,
  ]);

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

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

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
          accessibilityLabel="Edit offer"
          onPress={() => openEditOffer(offer)}
          style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.9 }]}
        >
          <Feather name="edit-2" size={18} color="white" />
          {/* <Text style={styles.actionText}>{t("editOffer")}</Text> */}
        </Pressable>

        <Pressable
          accessibilityLabel="Withdraw offer"
          onPress={() => confirmWithdraw(offer.id)}
          style={({ pressed }) => [
            styles.withdrawBtn,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Feather name="trash-2" size={18} color="white" />
          {/* <Text style={styles.actionText}>{t("withdrawOffer")}</Text> */}
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
            label={`${t("offerWithdrawn")} (${offerViewCounts.withdrawn})`}
            active={filter === "withdrawn"}
            onPress={() => setFilter("withdrawn")}
          />

          <FilterBtn
            label={`${t("skipped")} (${counts.skipped})`}
            active={filter === "skipped"}
            onPress={() => setFilter("skipped")}
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
      ) : isGuest ? (
        <ScrollView contentContainerStyle={styles.scrollGrow}>
          <View style={styles.centerCard}>
            <Text style={styles.centerTitle}>{t("signInRequired")}</Text>
            <Text style={styles.centerSub}>{t("pleaseSignIn")}</Text>
            <Pressable
              style={[styles.filterBtn, styles.filterBtnActive]}
              onPress={() => router.push("/sign-in" as any)}
            >
              <Text style={[styles.filterText, styles.filterTextActive]}>
                {t("signIn")}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : visible.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.scrollGrow}
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
          {visible.map(({ request, direction, sectionKey }, visibleIdx) => {
            // ─── Section header when group changes ───
            const prevSection =
              visibleIdx > 0 ? visible[visibleIdx - 1].sectionKey : null;
            const showSectionHeader = sectionKey !== prevSection;

            const sectionDotStyle =
              sectionKey === "sectionNeedsResponse"
                ? styles.sectionHeaderDotNeedsResponse
                : sectionKey === "sectionWaiting"
                  ? styles.sectionHeaderDotWaiting
                  : sectionKey === "sectionCompleted"
                    ? styles.sectionHeaderDotCompleted
                    : sectionKey === "sectionRejected"
                      ? styles.sectionHeaderDotRejected
                      : sectionKey === "sectionWithdrawn"
                        ? styles.sectionHeaderDotWithdrawn
                        : sectionKey === "sectionInterested"
                          ? styles.sectionHeaderDotInterested
                          : styles.sectionHeaderDotDefault;

            const latestOffer = latestOfferByRequestId.get(request.id);
            const counter = latestCounterByRequestId.get(request.id);
            const requestOffers = offersByRequestId.get(request.id) ?? [];
            const isThreadOpen = openThreads[request.id] !== false;
            const olderRoundsOpen = openOlderThreads[request.id] === true;
            const roundsToRender = olderRoundsOpen
              ? requestOffers
              : requestOffers.slice(0, 1);

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

            const isDetailsOpen = openDetails[request.id] === true;

            // Left-border accent communicates status at a glance
            const cardAccentStyle =
              effectiveState === "accepted" ||
              effectiveState === "counter_accepted"
                ? styles.cardAccentAccepted
                : effectiveState === "counter_pending"
                  ? styles.cardAccentCounterPending
                  : effectiveState === "pending"
                    ? styles.cardAccentPending
                    : effectiveState === "rejected"
                      ? styles.cardAccentRejected
                      : latestOffer?.status === "withdrawn"
                        ? styles.cardAccentWithdrawn
                        : styles.cardAccentDefault;

            // Status badge label + styles
            const statusBadge = (() => {
              if (
                effectiveState === "accepted" ||
                effectiveState === "counter_accepted"
              )
                return {
                  label:
                    effectiveState === "counter_accepted"
                      ? t("counterOfferAccepted")
                      : t("accepted"),
                  bgStyle: styles.statusBadgeBgAccepted,
                  fgStyle: styles.statusBadgeTextAccepted,
                };
              if (effectiveState === "counter_pending")
                return {
                  label: t("counterOfferPending"),
                  bgStyle: styles.statusBadgeBgCounterPending,
                  fgStyle: styles.statusBadgeTextCounterPending,
                };
              if (effectiveState === "pending")
                return {
                  label: t("offerPending"),
                  bgStyle: styles.statusBadgeBgPending,
                  fgStyle: styles.statusBadgeTextPending,
                };
              if (effectiveState === "rejected")
                return {
                  label: t("rejectedCanResend"),
                  bgStyle: styles.statusBadgeBgRejected,
                  fgStyle: styles.statusBadgeTextRejected,
                };
              if (latestOffer?.status === "withdrawn")
                return {
                  label: t("offerWithdrawn"),
                  bgStyle: styles.statusBadgeBgWithdrawn,
                  fgStyle: styles.statusBadgeTextWithdrawn,
                };
              if (direction === "right")
                return {
                  label: t("noOfferYet"),
                  bgStyle: styles.statusBadgeBgNoOffer,
                  fgStyle: styles.statusBadgeTextNoOffer,
                };
              return {
                label: t("skipped"),
                bgStyle: styles.statusBadgeBgWithdrawn,
                fgStyle: styles.statusBadgeTextWithdrawn,
              };
            })();

            return (
              <React.Fragment key={request.id}>
                {showSectionHeader && (
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLine} />
                    <View style={styles.sectionHeaderBadge}>
                      <View
                        style={[styles.sectionHeaderDot, sectionDotStyle]}
                      />
                      <Text style={styles.sectionHeaderText}>
                        {t(sectionKey)}
                      </Text>
                    </View>
                    <View style={styles.sectionHeaderLine} />
                  </View>
                )}
                <View style={[styles.card, cardAccentStyle]}>
                  {/* ─── REQUEST SECTION ─── */}
                  <View style={styles.requestSection}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <Text style={styles.categoryLabel}>
                          {request.category}
                        </Text>
                        <Text
                          style={styles.title}
                          numberOfLines={isDetailsOpen ? 0 : 2}
                        >
                          {request.title}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, statusBadge.bgStyle]}>
                        <Text
                          style={[styles.statusBadgeText, statusBadge.fgStyle]}
                        >
                          {statusBadge.label}
                        </Text>
                      </View>
                    </View>

                    {/* Posted by — only when expanded */}
                    {isDetailsOpen && (
                      <Text style={styles.postedBy}>
                        {t("postedBy")}{" "}
                        {request.profiles?.display_name ?? "unknown"}
                      </Text>
                    )}

                    {/* Description — 1 line when collapsed */}
                    <Text
                      style={styles.desc}
                      numberOfLines={isDetailsOpen ? 0 : 1}
                    >
                      {request.description}
                    </Text>

                    {/* Location — only when expanded */}
                    {isDetailsOpen && !!request.location && (
                      <Text style={styles.location}>📍 {request.location}</Text>
                    )}

                    {/* Detail grid — only when expanded */}
                    {isDetailsOpen &&
                      (() => {
                        const rows: { label: string; value: string }[] = [];
                        if (
                          request.posting_as &&
                          postingAsKeys[request.posting_as]
                        )
                          rows.push({
                            label: t("postingAs"),
                            value: t(postingAsKeys[request.posting_as]),
                          });
                        if (
                          request.preferred_schedule &&
                          scheduleKeys[request.preferred_schedule]
                        )
                          rows.push({
                            label: t("preferredSchedule"),
                            value: t(scheduleKeys[request.preferred_schedule]),
                          });
                        if (
                          request.preferred_schedule === "specific_date" &&
                          request.scheduled_date
                        )
                          rows.push({
                            label: t("scheduledDate"),
                            value: request.scheduled_date,
                          });
                        if (request.duration && durationKeys[request.duration])
                          rows.push({
                            label: t("durationLabel"),
                            value: t(durationKeys[request.duration]),
                          });
                        if (request.workers_needed != null)
                          rows.push({
                            label: t("workersLabel"),
                            value: String(request.workers_needed),
                          });
                        if (
                          request.work_mode &&
                          workModeKeys[request.work_mode]
                        )
                          rows.push({
                            label: t("workModeLabel"),
                            value: t(workModeKeys[request.work_mode]),
                          });
                        if (
                          request.experience_level &&
                          experienceKeys[request.experience_level]
                        )
                          rows.push({
                            label: t("experienceLabel"),
                            value: t(experienceKeys[request.experience_level]),
                          });
                        if (
                          request.equipment &&
                          equipmentKeys[request.equipment]
                        )
                          rows.push({
                            label: t("equipmentLabel"),
                            value: t(equipmentKeys[request.equipment]),
                          });
                        return (
                          <>
                            {rows.length > 0 && (
                              <View style={styles.detailGrid}>
                                {rows.map((d, i) => (
                                  <View key={i} style={styles.detailGridItem}>
                                    <Text style={styles.detailGridLabel}>
                                      {d.label}
                                    </Text>
                                    <Text style={styles.detailGridValue}>
                                      {d.value}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                            {!!request.special_requirements && (
                              <View style={styles.specialReqBox}>
                                <Text style={styles.detailGridLabel}>
                                  {t("specialRequirementsLabel")}
                                </Text>
                                <Text style={styles.specialReqText}>
                                  {request.special_requirements}
                                </Text>
                              </View>
                            )}
                          </>
                        );
                      })()}

                    {/* Photos — only when expanded */}
                    {isDetailsOpen &&
                      request.photos &&
                      request.photos.length > 0 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.photoRow}
                        >
                          {request.photos.map((uri, i) => (
                            <Pressable
                              key={i}
                              onPress={() => openViewer(request.photos!, i)}
                            >
                              <Image
                                source={{ uri }}
                                style={styles.photoThumb}
                              />
                            </Pressable>
                          ))}
                        </ScrollView>
                      )}

                    {/* Budget + swipe status pills */}
                    <View style={styles.metaRow}>
                      <View style={styles.basePill}>
                        <Text style={styles.pillTextMuted}>
                          {t("budgetLabel")}:{" "}
                        </Text>
                        <Text style={styles.pillText}>
                          {request.open_budget
                            ? t("openBudget")
                            : request.budget_type &&
                                request.budget_type !== "range" &&
                                budgetTypeKeys[request.budget_type]
                              ? `${formatPrice(request.budget_min)} ${t(budgetTypeKeys[request.budget_type])}`
                              : `${formatPrice(request.budget_min)} – ${formatPrice(request.budget_max)}`}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.basePill,
                          direction === "right"
                            ? styles.pillInterested
                            : styles.pillSkipped,
                        ]}
                      >
                        <Text style={styles.pillText}>
                          {direction === "right"
                            ? `👍 ${t("interested")}`
                            : `👎 ${t("skipped")}`}
                        </Text>
                      </View>
                    </View>

                    {/* Explicit expand / collapse affordance */}
                    <Pressable
                      style={styles.expandRow}
                      onPress={() => toggleDetails(request.id)}
                    >
                      <Text style={styles.expandRowText}>
                        {isDetailsOpen ? t("collapse") : t("showDetails")}
                      </Text>
                      <Feather
                        name={isDetailsOpen ? "chevron-up" : "chevron-down"}
                        size={13}
                        color="#94a3b8"
                      />
                    </Pressable>

                    {isDetailsOpen && (
                      <Pressable
                        style={styles.openRequestBtn}
                        onPress={() =>
                          router.push(`/request/${request.id}` as any)
                        }
                      >
                        <Text style={styles.openRequestBtnText}>
                          {t("openRequestPage")}
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {/* ─── OFFER SECTION ─── */}
                  <View style={styles.offerActivitySection}>
                    {/* Your offer — shown as a labelled line, not a pill */}
                    {latestOffer && latestOffer.status !== "withdrawn" && (
                      <View style={styles.offerLine}>
                        <Text style={styles.offerLineLabel}>
                          {t("yourReOffer")}
                        </Text>
                        <Text style={styles.offerLinePrice}>
                          {formatPrice(Number(latestOffer.price))}
                        </Text>
                      </View>
                    )}

                    {/* ─── Accepted offer summary ─── */}
                    {latestOffer &&
                      latestOffer.status !== "withdrawn" &&
                      (() => {
                        const acceptedCounterPrice =
                          counterAccepted && counter
                            ? Number(counter.price)
                            : null;
                        const directAccepted =
                          !counterAccepted && latestOffer.status === "accepted";
                        const resolvedPrice =
                          acceptedCounterPrice ??
                          (directAccepted ? Number(latestOffer.price) : null);

                        return (
                          <View style={styles.decisionLine}>
                            <Text style={styles.offerLineLabel}>
                              {t("acceptedOfferLabel")}:
                            </Text>
                            <Text
                              style={[
                                styles.decisionValue,
                                resolvedPrice !== null
                                  ? styles.decisionValueAccepted
                                  : styles.decisionValuePending,
                              ]}
                            >
                              {resolvedPrice !== null
                                ? formatPrice(resolvedPrice)
                                : t("decisionPending")}
                            </Text>
                          </View>
                        );
                      })()}

                    {/* ─── Negotiation history toggle ─── */}
                    {requestOffers.length > 0 && (
                      <View style={styles.historySection}>
                        <Pressable
                          style={styles.historyToggle}
                          onPress={() => toggleThread(request.id)}
                        >
                          <Feather
                            name={isThreadOpen ? "chevron-up" : "chevron-down"}
                            size={14}
                            color="#64748b"
                          />
                          <Text style={styles.historyToggleText}>
                            {isThreadOpen
                              ? t("hideNegotiation")
                              : `${t("showNegotiation")} (${requestOffers.length})`}
                          </Text>
                        </Pressable>

                        {isThreadOpen && (
                          <View style={styles.threadWrap}>
                            {roundsToRender.map((o, idx) => {
                              const realIdx = olderRoundsOpen ? idx : 0;
                              const counters =
                                countersByOfferId.get(o.id) ?? [];
                              const acceptedCounter =
                                counters.find((x) => x.status === "accepted") ??
                                null;
                              // When a counter was accepted the offer row in DB also
                              // gets status="accepted", but visually it was countered.
                              const offerDisplayStatus = acceptedCounter
                                ? "rejected"
                                : o.status;
                              const isLatest = idx === 0;
                              const offerCanEdit =
                                o.status !== "accepted" &&
                                o.status !== "withdrawn" &&
                                o.status !== "rejected";
                              const offerRowRef =
                                React.createRef<SwipeableMethods>();

                              return (
                                <View key={o.id} style={styles.roundContainer}>
                                  {/* Round label — only when multiple rounds */}
                                  {requestOffers.length > 1 && (
                                    <View style={styles.roundLabelRow}>
                                      <Text style={styles.roundLabelText}>
                                        {t("roundLabel")}{" "}
                                        {requestOffers.length - realIdx}
                                        {realIdx === 0
                                          ? ` · ${t("roundCurrent")}`
                                          : ""}
                                      </Text>
                                    </View>
                                  )}

                                  {/* Counter offers — newest first, above the offer */}
                                  {counters.map((c) => {
                                    const cPending = c.status === "pending";
                                    return (
                                      <React.Fragment key={c.id}>
                                        <View style={styles.buyerBlock}>
                                          <View style={styles.buyerBlockTop}>
                                            <Text style={styles.buyerBlockFrom}>
                                              {t("counterOfferLabel")}
                                            </Text>
                                            <Text style={styles.offerMeta}>
                                              {formatDateTime(c.created_at)}
                                            </Text>
                                          </View>
                                          <Text
                                            style={[
                                              styles.buyerBlockPrice,
                                              c.status === "accepted" &&
                                                styles.buyerBlockPriceAccepted,
                                              c.status === "rejected" &&
                                                styles.buyerBlockPriceRejected,
                                            ]}
                                          >
                                            {formatPrice(Number(c.price))}
                                            <Text style={styles.youBlockStatus}>
                                              {" "}
                                              ·{" "}
                                              {t(
                                                c.status === "pending"
                                                  ? "pendingStatus"
                                                  : c.status === "accepted"
                                                    ? "acceptedStatus"
                                                    : c.status === "rejected"
                                                      ? "rejectedStatus"
                                                      : "withdrawnStatus",
                                              )}
                                            </Text>
                                          </Text>
                                          {!!c.message && (
                                            <>
                                              <Text
                                                style={styles.counterMsg}
                                                numberOfLines={
                                                  expandedOfferDesc[c.id]
                                                    ? 0
                                                    : 3
                                                }
                                              >
                                                {c.message}
                                              </Text>
                                              <Pressable
                                                onPress={() =>
                                                  toggleOfferDesc(c.id)
                                                }
                                              >
                                                <Text style={styles.offerMeta}>
                                                  {expandedOfferDesc[c.id]
                                                    ? t("showLess")
                                                    : t("showMore")}
                                                </Text>
                                              </Pressable>
                                            </>
                                          )}
                                          {isLatest && cPending && (
                                            <View style={styles.counterActions}>
                                              <Pressable
                                                style={styles.btnPrimary}
                                                onPress={() => acceptCounter(c)}
                                              >
                                                <Text
                                                  style={styles.btnPrimaryText}
                                                >
                                                  {t("acceptCounter")}
                                                </Text>
                                              </Pressable>
                                              <Pressable
                                                style={styles.btnSecondary}
                                                onPress={() => rejectCounter(c)}
                                              >
                                                <Text
                                                  style={
                                                    styles.btnSecondaryText
                                                  }
                                                >
                                                  {t("reject")}
                                                </Text>
                                              </Pressable>
                                            </View>
                                          )}
                                        </View>
                                        {/* Arrow pointing up: counter offer responded to the offer below */}
                                        <View style={styles.flowArrow}>
                                          <Text style={styles.flowArrowText}>
                                            ↑
                                          </Text>
                                        </View>
                                      </React.Fragment>
                                    );
                                  })}

                                  {/* Your offer — below the counter, swipeable for edit/withdraw */}
                                  <ReanimatedSwipeable
                                    ref={offerRowRef}
                                    renderRightActions={() =>
                                      offerCanEdit
                                        ? renderRightActions(o)
                                        : null
                                    }
                                    overshootRight={false}
                                    onSwipeableWillOpen={() => {
                                      if (
                                        openRowRef.current &&
                                        openRowRef.current !==
                                          offerRowRef.current
                                      ) {
                                        openRowRef.current.close();
                                      }
                                    }}
                                    onSwipeableOpen={() => {
                                      openRowRef.current = offerRowRef.current;
                                    }}
                                  >
                                    <View
                                      style={[
                                        styles.youBlock,
                                        isLatest && styles.youBlockLatest,
                                      ]}
                                    >
                                      <View style={styles.youBlockTop}>
                                        <Text style={styles.youBlockFrom}>
                                          {realIdx === requestOffers.length - 1
                                            ? t("yourOffer")
                                            : t("yourReOffer")}
                                        </Text>
                                        <Text style={styles.offerMeta}>
                                          {formatDateTime(o.created_at)}
                                        </Text>
                                      </View>
                                      <Text
                                        style={[
                                          styles.youBlockPrice,
                                          (offerDisplayStatus === "rejected" ||
                                            offerDisplayStatus ===
                                              "withdrawn") &&
                                            styles.youBlockPriceBad,
                                          offerDisplayStatus === "accepted" &&
                                            styles.youBlockPriceGood,
                                        ]}
                                      >
                                        {formatPrice(Number(o.price))}
                                        <Text style={styles.youBlockStatus}>
                                          {" "}
                                          ·{" "}
                                          {t(
                                            offerDisplayStatus === "pending"
                                              ? "pendingStatus"
                                              : offerDisplayStatus ===
                                                  "accepted"
                                                ? "acceptedStatus"
                                                : offerDisplayStatus ===
                                                    "rejected"
                                                  ? "rejectedStatus"
                                                  : "withdrawnStatus",
                                          )}
                                        </Text>
                                      </Text>
                                      {!!o.description && (
                                        <>
                                          <Text
                                            style={styles.offerDesc}
                                            numberOfLines={
                                              expandedOfferDesc[o.id] ? 0 : 3
                                            }
                                          >
                                            {o.description}
                                          </Text>
                                          <Pressable
                                            onPress={() =>
                                              toggleOfferDesc(o.id)
                                            }
                                          >
                                            <Text style={styles.offerMeta}>
                                              {expandedOfferDesc[o.id]
                                                ? t("showLess")
                                                : t("showMore")}
                                            </Text>
                                          </Pressable>
                                        </>
                                      )}
                                      {offerCanEdit && isLatest && (
                                        <View style={styles.swipeHint}>
                                          <Feather
                                            name="chevrons-left"
                                            size={11}
                                            color="#93c5fd"
                                          />
                                          <Text style={styles.swipeHintText}>
                                            {t("swipeToEditWithdraw")}
                                          </Text>
                                        </View>
                                      )}
                                    </View>
                                  </ReanimatedSwipeable>

                                  {/* Older rounds toggle */}
                                  {!olderRoundsOpen &&
                                    requestOffers.length > 1 &&
                                    idx === 0 && (
                                      <View style={styles.betweenRoundsDivider}>
                                        <View
                                          style={styles.betweenRoundsLine}
                                        />
                                        <Pressable
                                          style={styles.betweenRoundsBadge}
                                          onPress={() =>
                                            toggleOlderThread(request.id)
                                          }
                                        >
                                          <Feather
                                            name="chevron-down"
                                            size={11}
                                            color="#94a3b8"
                                          />
                                          <Text
                                            style={styles.betweenRoundsText}
                                          >
                                            {t("earlier")} (
                                            {requestOffers.length - 1})
                                          </Text>
                                        </Pressable>
                                        <View
                                          style={styles.betweenRoundsLine}
                                        />
                                      </View>
                                    )}

                                  {olderRoundsOpen &&
                                    idx === roundsToRender.length - 1 &&
                                    requestOffers.length > 1 && (
                                      <View style={styles.betweenRoundsDivider}>
                                        <View
                                          style={styles.betweenRoundsLine}
                                        />
                                        <Pressable
                                          style={styles.betweenRoundsBadge}
                                          onPress={() =>
                                            toggleOlderThread(request.id)
                                          }
                                        >
                                          <Feather
                                            name="chevron-up"
                                            size={11}
                                            color="#94a3b8"
                                          />
                                          <Text
                                            style={styles.betweenRoundsText}
                                          >
                                            {t("collapse")}
                                          </Text>
                                        </Pressable>
                                        <View
                                          style={styles.betweenRoundsLine}
                                        />
                                      </View>
                                    )}
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    )}

                    {/* ─── Bottom actions ─── */}
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
                </View>
              </React.Fragment>
            );
          })}
        </ScrollView>
      )}

      <ImageViewer
        images={viewerImages}
        visible={viewerVisible}
        initialIndex={viewerIndex}
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
