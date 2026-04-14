import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { ImageViewer } from "../../../src/components/ImageViewer";
import { Screen } from "../../../src/components/Screen";
import { useCurrency } from "../../../src/context/CurrencyContext";
import { useTranslation } from "../../../src/context/LanguageContext";
import { supabase } from "../../../src/lib/supabase";
import { styles, theme } from "./index.styles";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  duration: string | null;
  workers_needed: number | null;
  work_mode: string | null;
  experience_level: string | null;
  equipment: string | null;
  preferred_schedule: string | null;
  scheduled_date: string | null;
  special_requirements: string | null;
  photos: string[] | null;
};

type OfferStatus = "pending" | "accepted" | "rejected" | "withdrawn";
type CounterStatus = "pending" | "accepted" | "rejected" | "withdrawn";
type OfferFilter = "all" | OfferStatus;

type OfferRow = {
  id: string;
  request_id: string;
  user_id: string;
  price: number;
  description: string;
  status: OfferStatus;
  created_at: string;
  profiles?:
    | { display_name: string | null }[]
    | { display_name: string | null }
    | null;
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

const categoryTranslationKeys: Record<string, string> = {
  Vehicles: "vehicles",
  "Real Estate": "realEstate",
  Services: "services",
  "Electronics & Tech": "electronics",
  "Fashion & Personal": "fashion",
  Other: "other",
};

const statusKeys: Record<string, string> = {
  active: "open",
  matched: "negotiating",
  closed: "closed",
};

const budgetTypeKeys: Record<string, string> = {
  per_hour: "budgetPerHour",
  per_day: "budgetPerDay",
  fixed: "budgetFixed",
};

const timelineKeys: Record<string, string> = {
  asap: "timelineAsap",
  specific_date: "timelineDate",
  flexible: "timelineFlexible",
};

const scheduleKeys: Record<string, string> = {
  anytime: "scheduleAnytime",
  weekdays: "scheduleWeekdays",
  weekends: "scheduleWeekends",
  specific_date: "scheduleSpecificDate",
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

function getDisplayName(profiles: OfferRow["profiles"]): string {
  if (!profiles) return "user";
  if (Array.isArray(profiles)) return profiles[0]?.display_name ?? "user";
  return profiles.display_name ?? "user";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RequestDetailScreen() {
  const t = useTranslation();
  const { formatPrice } = useCurrency();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [request, setRequest] = useState<RequestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [myOfferId, setMyOfferId] = useState<string | null>(null);
  const [hasSwipedRight, setHasSwipedRight] = useState(false);
  const didInitialLoad = useRef(false);

  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [counters, setCounters] = useState<CounterOfferRow[]>([]);
  const [offerFilter, setOfferFilter] = useState<OfferFilter>("all");
  const [descExpanded, setDescExpanded] = useState(false);

  const [photoIndex, setPhotoIndex] = useState(0);
  const photoListRef = useRef<FlatList>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;

    const { data, error } = await supabase
      .from("requests")
      .select(
        "id,user_id,title,description,category,budget_min,budget_max,location,status,created_at,open_budget,posting_as,budget_type,timeline,preferred_schedule,scheduled_date,duration,workers_needed,work_mode,experience_level,equipment,special_requirements,photos",
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      Alert.alert(t("error"), t("requestNotFound"));
      router.back();
      return;
    }

    setRequest(data as RequestRow);
    const owner = !!user && data.user_id === user.id;
    setIsOwner(owner);

    if (user && !owner) {
      const { data: existingOffer } = await supabase
        .from("offers")
        .select("id,status")
        .eq("request_id", id)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();
      setMyOfferId(existingOffer?.id ?? null);

      const { data: swipeData } = await supabase
        .from("request_swipes")
        .select("direction")
        .eq("request_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      setHasSwipedRight(swipeData?.direction === "right");
    }

    if (owner) {
      const { data: off } = await supabase
        .from("offers")
        .select(
          `id,request_id,user_id,price,description,status,created_at,
          profiles!offers_user_id_fkey(display_name)`,
        )
        .eq("request_id", id)
        .order("created_at", { ascending: false });

      setOffers((off ?? []) as OfferRow[]);

      const { data: co } = await supabase
        .from("counter_offers")
        .select(
          "id,request_id,offer_id,requester_id,seller_id,price,message,status,created_at",
        )
        .eq("request_id", id)
        .order("created_at", { ascending: false });

      setCounters((co ?? []) as CounterOfferRow[]);
    }

    setLoading(false);
  }, [id, t]);

  useFocusEffect(
    useCallback(() => {
      if (!didInitialLoad.current) {
        didInitialLoad.current = true;
        setLoading(true);
        load();
      }
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const latestCounterByOfferId = useMemo(() => {
    const map = new Map<string, CounterOfferRow>();
    for (const c of counters) {
      if (!map.has(c.offer_id)) map.set(c.offer_id, c);
    }
    return map;
  }, [counters]);

  const offerCounts = useMemo(() => {
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
      if (o.status === "withdrawn") return false;
      const c = latestCounterByOfferId.get(o.id);
      if (c?.status === "accepted") return false;
      return o.status === "rejected";
    }).length;
    const withdrawn = offers.filter((o) => o.status === "withdrawn").length;
    return { all, pending, accepted, rejected, withdrawn };
  }, [offers, latestCounterByOfferId]);

  const filteredOffers = useMemo(() => {
    if (offerFilter === "all") return offers;
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
      return effective === offerFilter;
    });
  }, [offers, offerFilter, latestCounterByOfferId]);

  const acceptOffer = async (offerId: string) => {
    const { error: acceptError } = await supabase
      .from("offers")
      .update({ status: "accepted" })
      .eq("id", offerId);

    if (acceptError) {
      Alert.alert(acceptError.message);
      return;
    }

    const { error: rejectOthersError } = await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("request_id", id)
      .neq("id", offerId)
      .eq("status", "pending");

    if (rejectOthersError) {
      Alert.alert(rejectOthersError.message);
      return;
    }

    const { error: matchRequestError } = await supabase
      .from("requests")
      .update({ status: "matched" })
      .eq("id", id);

    if (matchRequestError) {
      Alert.alert(matchRequestError.message);
      return;
    }

    await load();
  };

  const rejectOffer = async (offerId: string) => {
    const { error } = await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("id", offerId);

    if (error) {
      Alert.alert(error.message);
      return;
    }

    await load();
  };

  const openRejectMenu = (offer: OfferRow) => {
    const name = getDisplayName(offer.profiles);
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
                sellerEmail: name,
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
              sellerEmail: name,
              originalPrice: String(offer.price),
            },
          } as any);
        },
      },
    ]);
  };

  const deleteRequest = () => {
    if (!request) return;
    Alert.alert(t("deleteRequest"), t("deleteConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          await supabase.from("requests").delete().eq("id", request.id);
          router.back();
        },
      },
    ]);
  };

  if (loading || !request) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text>{t("loading")}</Text>
        </View>
      </Screen>
    );
  }

  const photos = request.photos ?? [];
  const hasPhotos = photos.length > 0;

  const budgetLabel = request.open_budget
    ? t("openBudget")
    : request.budget_type &&
        request.budget_type !== "range" &&
        budgetTypeKeys[request.budget_type]
      ? `${formatPrice(request.budget_min ?? 0)} ${t(budgetTypeKeys[request.budget_type])}`
      : `${formatPrice(request.budget_min ?? 0)} – ${formatPrice(request.budget_max ?? 0)}`;

  const detailBadges: string[] = [];
  if (request.timeline && timelineKeys[request.timeline])
    detailBadges.push(t(timelineKeys[request.timeline]));
  if (request.work_mode && workModeKeys[request.work_mode])
    detailBadges.push(t(workModeKeys[request.work_mode]));
  if (
    request.experience_level &&
    request.experience_level !== "any" &&
    experienceKeys[request.experience_level]
  )
    detailBadges.push(t(experienceKeys[request.experience_level]));
  if (
    request.budget_type &&
    request.budget_type !== "range" &&
    budgetTypeKeys[request.budget_type]
  )
    detailBadges.push(t(budgetTypeKeys[request.budget_type]));

  const detailRows: { label: string; value: string }[] = [];

  if (request.preferred_schedule && scheduleKeys[request.preferred_schedule])
    detailRows.push({
      label: t("preferredSchedule"),
      value: t(scheduleKeys[request.preferred_schedule]),
    });
  if (request.preferred_schedule === "specific_date" && request.scheduled_date)
    detailRows.push({
      label: t("scheduledDate"),
      value: request.scheduled_date,
    });
  if (request.duration && durationKeys[request.duration])
    detailRows.push({
      label: t("durationLabel"),
      value: t(durationKeys[request.duration]),
    });
  if (request.workers_needed != null)
    detailRows.push({
      label: t("workersLabel"),
      value: String(request.workers_needed),
    });
  if (request.work_mode && workModeKeys[request.work_mode])
    detailRows.push({
      label: t("workModeLabel"),
      value: t(workModeKeys[request.work_mode]),
    });
  if (request.experience_level && experienceKeys[request.experience_level])
    detailRows.push({
      label: t("experienceLabel"),
      value: t(experienceKeys[request.experience_level]),
    });
  if (request.budget_type && budgetTypeKeys[request.budget_type])
    detailRows.push({
      label: t("budgetTypeLabel"),
      value: t(budgetTypeKeys[request.budget_type]),
    });
  if (request.equipment && equipmentKeys[request.equipment])
    detailRows.push({
      label: t("equipmentLabel"),
      value: t(equipmentKeys[request.equipment]),
    });

  return (
    <Screen>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* ── Photo gallery ── */}
          {hasPhotos ? (
            <View style={styles.photoContainer}>
              <FlatList
                ref={photoListRef}
                data={photos}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => String(i)}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(
                    e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                  );
                  setPhotoIndex(idx);
                }}
                renderItem={({ item: uri, index: i }) => (
                  <Pressable
                    onPress={() => {
                      setViewerIndex(i);
                      setViewerVisible(true);
                    }}
                  >
                    <Image
                      source={{ uri }}
                      style={styles.photoPage}
                      resizeMode="cover"
                    />
                  </Pressable>
                )}
              />
              {photos.length > 1 && (
                <View style={styles.dotsRow}>
                  {photos.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, i === photoIndex && styles.dotActive]}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noPhotoBox}>
              <Feather name="image" size={36} color={theme.secondaryText} />
              <Text style={styles.noPhotoText}>{t("addPhotos")}</Text>
            </View>
          )}

          {/* ── Main info card ── */}
          <View style={styles.infoCard}>
            <View style={styles.badgeRow}>
              {request.posting_as === "offering" && (
                <View style={styles.offeringBadge}>
                  <Text style={styles.offeringBadgeText}>
                    {t("postingOffering")}
                  </Text>
                </View>
              )}
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {t(categoryTranslationKeys[request.category] || "other")}
                </Text>
              </View>
              {(isOwner || hasSwipedRight) && (
                <View
                  style={[
                    styles.statusBadge,
                    request.status === "active"
                      ? styles.statusOpen
                      : request.status === "matched"
                        ? styles.statusNegotiating
                        : styles.statusClosed,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {t(statusKeys[request.status] ?? "open")}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.title}>{request.title}</Text>

            <View style={styles.priceRow}>
              <Feather name="dollar-sign" size={18} color={theme.primary} />
              <Text style={styles.price}>{budgetLabel}</Text>
            </View>

            <View style={styles.metaRow}>
              {!!request.location && (
                <View style={styles.metaItem}>
                  <Feather
                    name="map-pin"
                    size={14}
                    color={theme.secondaryText}
                  />
                  <Text style={styles.metaText}>{request.location}</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Feather name="clock" size={14} color={theme.secondaryText} />
                <Text style={styles.metaText}>
                  {formatDateTime(request.created_at)}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Offers summary banner (owner only, when there are offers) ── */}
          {isOwner && offerCounts.all > 0 && (
            <Pressable
              style={styles.offersBanner}
              onPress={() => {
                /* scroll handled by being above description */
              }}
            >
              <View style={styles.offersBannerLeft}>
                <Feather name="inbox" size={18} color={theme.primary} />
                <Text style={styles.offersBannerTitle}>
                  {offerCounts.all}{" "}
                  {offerCounts.all === 1 ? t("offer") : t("offers")}
                </Text>
              </View>
              <View style={styles.offersBannerBadges}>
                {offerCounts.pending > 0 && (
                  <View style={[styles.offersBannerPill, styles.pillPending]}>
                    <Text style={styles.offersBannerPillText}>
                      {offerCounts.pending} {t("pending")}
                    </Text>
                  </View>
                )}
                {offerCounts.accepted > 0 && (
                  <View style={[styles.offersBannerPill, styles.pillAccepted]}>
                    <Text style={styles.offersBannerPillText}>
                      {offerCounts.accepted} {t("accepted")}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          )}

          {/* ── No offers yet banner (owner only) ── */}
          {isOwner && offerCounts.all === 0 && (
            <View style={styles.offersBannerEmpty}>
              <Feather name="inbox" size={18} color={theme.secondaryText} />
              <Text style={styles.offersBannerEmptyText}>
                {t("noOffersYet")}
              </Text>
            </View>
          )}

          {/* ── Closed banner ── */}
          {request.status === "closed" && (
            <View style={styles.closedBanner}>
              <Feather name="lock" size={18} color={theme.secondaryText} />
              <Text style={styles.closedText}>{t("requestClosed")}</Text>
            </View>
          )}

          {/* ── Description (expandable) ── */}
          {!!request.description && (
            <Pressable
              style={styles.sectionCard}
              onPress={() => setDescExpanded((prev) => !prev)}
            >
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t("description")}</Text>
                <Feather
                  name={descExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={theme.secondaryText}
                />
              </View>
              <Text
                style={styles.descText}
                numberOfLines={descExpanded ? 0 : 3}
              >
                {request.description}
              </Text>
            </Pressable>
          )}

          {/* ── Detail info (labeled grid) ── */}
          {(detailRows.length > 0 || !!request.special_requirements) && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{t("showDetails")}</Text>
              {detailRows.length > 0 && (
                <View style={styles.detailGrid}>
                  {detailRows.map((d, i) => (
                    <View key={i} style={styles.detailGridItem}>
                      <Text style={styles.detailGridLabel}>{d.label}</Text>
                      <Text style={styles.detailGridValue}>{d.value}</Text>
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
            </View>
          )}

          {/* ── Seller actions (only if swiped right) ── */}
          {!isOwner && hasSwipedRight && request.status === "active" && (
            <View style={styles.ownerActions}>
              {!myOfferId ? (
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/create-offer",
                      params: { requestId: id },
                    } as any)
                  }
                >
                  <Text style={styles.primaryBtnText}>{t("sendOffer")}</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    style={styles.primaryBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/create-offer",
                        params: { requestId: id, offerId: myOfferId },
                      } as any)
                    }
                  >
                    <Text style={styles.primaryBtnText}>{t("editOffer")}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.dangerBtn}
                    onPress={async () => {
                      await supabase
                        .from("offers")
                        .delete()
                        .eq("id", myOfferId);
                      setMyOfferId(null);
                    }}
                  >
                    <Text style={styles.dangerText}>{t("withdrawOffer")}</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}

          {/* ── Offers section (owner only) ── */}
          {isOwner && (
            <View style={styles.sectionCard}>
              <View style={styles.offersHeader}>
                <Text style={styles.sectionTitle}>{t("offersHeader")}</Text>
                <Text style={styles.offersCount}>
                  {offerCounts.all}{" "}
                  {offerCounts.all === 1 ? t("offer") : t("offers")}
                </Text>
              </View>

              {offerCounts.withdrawn > 0 && (
                <View style={styles.withdrawnBanner}>
                  <Feather
                    name="alert-triangle"
                    size={14}
                    color={theme.danger}
                  />
                  <Text style={styles.withdrawnBannerText}>
                    {offerCounts.withdrawn}{" "}
                    {offerCounts.withdrawn === 1
                      ? t("offersWithdrawnWarning_one")
                      : t("offersWithdrawnWarning_other")}
                  </Text>
                </View>
              )}

              {offerCounts.all > 0 && (
                <View style={styles.filtersRow}>
                  {(
                    [
                      ["all", offerCounts.all],
                      ["pending", offerCounts.pending],
                      ["accepted", offerCounts.accepted],
                      ["rejected", offerCounts.rejected],
                      ["withdrawn", offerCounts.withdrawn],
                    ] as [OfferFilter, number][]
                  ).map(([key, count]) => (
                    <Pressable
                      key={key}
                      onPress={() => setOfferFilter(key)}
                      style={[
                        styles.filterChip,
                        offerFilter === key && styles.filterChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          offerFilter === key && styles.filterChipTextActive,
                        ]}
                      >
                        {t(key === "all" ? "all" : `${key}`)} ({count})
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {filteredOffers.length === 0 ? (
                <View style={styles.noOffersBox}>
                  <Feather name="inbox" size={24} color={theme.secondaryText} />
                  <Text style={styles.noOffersText}>{t("noOffersYet")}</Text>
                </View>
              ) : (
                filteredOffers.map((offer) => {
                  const sellerName = getDisplayName(offer.profiles);
                  const latestCounter = latestCounterByOfferId.get(offer.id);
                  const effectiveStatus: OfferStatus =
                    offer.status === "withdrawn"
                      ? "withdrawn"
                      : latestCounter?.status === "accepted"
                        ? "accepted"
                        : latestCounter?.status === "pending"
                          ? "pending"
                          : offer.status;
                  const isPending = effectiveStatus === "pending";
                  const isAccepted = effectiveStatus === "accepted";
                  const isWithdrawn = effectiveStatus === "withdrawn";

                  return (
                    <View key={offer.id} style={styles.offerCard}>
                      <View style={styles.offerTop}>
                        <Text style={styles.offerSeller}>{sellerName}</Text>
                        <View
                          style={[
                            styles.offerStatusPill,
                            isAccepted
                              ? styles.pillAccepted
                              : isWithdrawn
                                ? styles.pillWithdrawn
                                : effectiveStatus === "rejected"
                                  ? styles.pillRejected
                                  : styles.pillPending,
                          ]}
                        >
                          <Text style={styles.offerStatusText}>
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

                      <Text style={styles.offerPrice}>
                        {formatPrice(Number(offer.price))}
                      </Text>

                      {!!offer.description && (
                        <Text style={styles.offerDesc}>
                          {offer.description}
                        </Text>
                      )}

                      {offer.status === "withdrawn" && (
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

                      {isPending && !isWithdrawn && (
                        <View style={styles.offerActions}>
                          <Pressable
                            onPress={() => openRejectMenu(offer)}
                            style={[styles.actionBtn, styles.btnSecondary]}
                          >
                            <Text style={styles.btnSecondaryText}>
                              {t("reject")}
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => acceptOffer(offer.id)}
                            style={[styles.actionBtn, styles.btnPrimary]}
                          >
                            <Text style={styles.btnPrimaryText}>
                              {t("accept")}
                            </Text>
                          </Pressable>
                        </View>
                      )}

                      {isAccepted && (
                        <View style={styles.offerActions}>
                          <Pressable
                            onPress={() =>
                              router.push({
                                pathname: "/request/[id]/chat",
                                params: { id: request.id },
                              } as any)
                            }
                            style={[styles.actionBtn, styles.btnPrimary]}
                          >
                            <Text style={styles.btnPrimaryText}>
                              {t("chat")}
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ── Owner actions ── */}
          {isOwner && (
            <View style={styles.ownerActions}>
              <Pressable
                style={styles.primaryBtn}
                onPress={() =>
                  router.push({
                    pathname: "/(modals)/create-request",
                    params: { requestId: request.id },
                  } as any)
                }
              >
                <Text style={styles.primaryBtnText}>{t("editRequest")}</Text>
              </Pressable>

              <Pressable style={styles.dangerBtn} onPress={deleteRequest}>
                <Text style={styles.dangerText}>{t("deleteRequest")}</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Back button — always visible overlay */}
        <Pressable style={styles.backBtnOverlay} onPress={() => router.back()}>
          <Feather name="chevron-left" size={22} color={theme.primaryText} />
        </Pressable>

        {/* Fullscreen image viewer */}
        <ImageViewer
          images={photos}
          visible={viewerVisible}
          initialIndex={viewerIndex}
          onClose={() => setViewerVisible(false)}
        />
      </View>
    </Screen>
  );
}
