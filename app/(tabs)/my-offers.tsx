import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Pressable,
    Text,
    View,
} from "react-native";
import { useTranslation } from "../../src/context/LanguageContext";
import { requireAuth } from "../../src/lib/authGuard";
import { supabase } from "../../src/lib/supabase";
import { styles, theme } from "./my-offers.styles";

type Application = {
  id: string;
  status: string;
  cover_letter: string | null;
  price: number | null;
  created_at: string;
  viewed_at: string | null;
  requests: {
    id: string;
    title: string;
    user_id: string;
    status: string;
    posting_as: string | null;
    profiles: { username: string | null } | null;
  } | null;
};

type ReceivedApplication = {
  id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  viewed_at: string | null;
  requests: {
    id: string;
    title: string;
  } | null;
  profiles: {
    id: string;
    username: string | null;
    bio: string | null;
    skills: string[] | null;
    linkedin_url: string | null;
    verified: boolean | null;
    avatar_url: string | null;
  } | null;
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: theme.warningLight, text: theme.warning },
  accepted: { bg: theme.successLight, text: theme.success },
  rejected: { bg: theme.errorLight, text: theme.error },
  withdrawn: { bg: theme.surfaceAlt, text: theme.mutedText },
};

type Tab = "sent" | "received";

export default function ApplicationsScreen() {
  const t = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("sent");
  const [sent, setSent] = useState<Application[]>([]);
  const [received, setReceived] = useState<ReceivedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [ratedOfferIds, setRatedOfferIds] = useState<Set<string>>(new Set());

  async function handleRate(
    offerId: string,
    revieweeId: string,
    requestId: string,
  ) {
    Alert.prompt(
      t("rateExperience"),
      "Enter a rating from 1 to 5",
      async (input) => {
        const rating = parseInt(input ?? "", 10);
        if (!rating || rating < 1 || rating > 5) {
          Alert.alert(t("error"), "Please enter a number from 1 to 5.");
          return;
        }
        if (!userId) return;
        const { error } = await supabase.from("reviews").insert({
          reviewer_id: userId,
          reviewee_id: revieweeId,
          request_id: requestId,
          offer_id: offerId,
          rating,
        });
        if (!error) {
          setRatedOfferIds((prev) => new Set([...prev, offerId]));
          Alert.alert(t("ratingThanks"));
        }
      },
      "plain-text",
      "",
      "number-pad",
    );
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      requireAuth();
      return;
    }
    setUserId(user.id);

    // Fetch own request IDs first, then filter offers by those IDs (more reliable than embedded filter)
    const [{ data: sentData }, { data: myRequests }, { data: myReviews }] =
      await Promise.all([
        supabase
          .from("offers")
          .select(
            "id, status, cover_letter, price, created_at, viewed_at, requests(id, title, user_id, status, posting_as, profiles(username))",
          )
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("requests").select("id").eq("user_id", user.id),
        supabase.from("reviews").select("offer_id").eq("reviewer_id", user.id),
      ]);

    const myRequestIds = (myRequests ?? []).map((r: any) => r.id);
    const { data: receivedData } = myRequestIds.length
      ? await supabase
          .from("offers")
          .select(
            "id, status, cover_letter, created_at, viewed_at, requests!inner(id, title, user_id), profiles!seller_id(id, username, bio, skills, linkedin_url, verified, avatar_url)",
          )
          .in("request_id", myRequestIds)
          .order("created_at", { ascending: false })
      : { data: [] };

    setSent((sentData as unknown as Application[]) ?? []);
    setReceived((receivedData as unknown as ReceivedApplication[]) ?? []);
    setRatedOfferIds(new Set((myReviews ?? []).map((r: any) => r.offer_id)));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // Realtime: stable channel on mount — instant update when offer status changes
  useEffect(() => {
    const channel = supabase
      .channel("my-offers-rt-stable")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "offers" },
        () => fetchData(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  async function markReceivedAsViewed(offerIds: string[]) {
    if (!offerIds.length) return;
    await supabase
      .from("offers")
      .update({ viewed_at: new Date().toISOString() })
      .in("id", offerIds)
      .is("viewed_at", null);
  }

  async function handleDispute(
    offerId: string,
    reportedUserId: string,
    requestId: string,
  ) {
    if (!userId) return;
    const reasons = [
      t("reportOutcomeNotPaid"),
      t("reportOutcomeNoShow"),
      t("reportOutcomeUnsafe"),
      t("reportOutcomeOther"),
    ];
    const reasonKeys = ["not_paid", "no_show", "unsafe_conditions", "other"];
    Alert.alert(
      t("reportOutcome"),
      t("reportOutcomeTitle"),
      reasons.map((label, i) => ({
        text: label,
        onPress: async () => {
          const { error } = await supabase.from("disputes").insert({
            reporter_id: userId,
            reported_user_id: reportedUserId,
            offer_id: offerId,
            request_id: requestId,
            reason: reasonKeys[i],
          });
          if (!error) Alert.alert(t("reportOutcomeSent"));
        },
      })),
    );
  }

  async function handleWithdraw(offerId: string) {
    Alert.alert(t("withdrawApplication"), t("withdrawConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("withdraw"),
        style: "destructive",
        onPress: async () => {
          await supabase
            .from("offers")
            .update({ status: "withdrawn" })
            .eq("id", offerId);
          fetchData();
        },
      },
    ]);
  }

  async function handleAccept(offerId: string, requestId: string) {
    await supabase
      .from("offers")
      .update({ status: "accepted" })
      .eq("id", offerId);
    await supabase
      .from("requests")
      .update({ status: "filled" })
      .eq("id", requestId);
    fetchData();
  }

  async function handleReject(offerId: string) {
    await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("id", offerId);
    fetchData();
  }

  function renderTimeline(item: Application) {
    const steps = [
      { key: "timelineApplied", done: true, color: theme.success },
      { key: "timelineSeen", done: !!item.viewed_at, color: theme.success },
      {
        key: "timelineShortlisted",
        done: item.status === "accepted" || item.status === "hired",
        color: theme.success,
      },
      {
        key: "timelineDecision",
        done:
          item.status === "hired" ||
          item.status === "rejected" ||
          item.status === "withdrawn",
        color:
          item.status === "rejected"
            ? theme.error
            : item.status === "withdrawn"
              ? theme.mutedText
              : theme.success,
      },
    ];
    return (
      <View style={styles.timeline}>
        <Text style={styles.timelineSectionLabel}>
          {t("applicationStatus")}
        </Text>
        {/* Dot + connector row */}
        <View style={styles.timelineDotsRow}>
          {steps.map((step, i) => (
            <React.Fragment key={step.key}>
              <View
                style={[
                  styles.timelineDot,
                  step.done && {
                    backgroundColor: step.color,
                    borderColor: step.color,
                  },
                ]}
              >
                {step.done && (
                  <Feather
                    name={item.status === "rejected" && i === 3 ? "x" : "check"}
                    size={9}
                    color="#FFFFFF"
                  />
                )}
              </View>
              {i < steps.length - 1 && (
                <View
                  style={[
                    styles.timelineConnector,
                    steps[i + 1].done && { backgroundColor: theme.success },
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
        {/* Label row */}
        <View style={styles.timelineLabelsRow}>
          {steps.map((step) => (
            <Text
              key={step.key}
              style={[
                styles.timelineLabel,
                step.done && { color: step.color, fontWeight: "700" },
              ]}
            >
              {t(step.key as any)}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  function renderSentItem({ item }: { item: Application }) {
    const c = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending;
    const job = item.requests;
    return (
      <View style={styles.card}>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => job && router.push(`/request/${job.id}`)}
            >
              <Text style={styles.cardTitle} numberOfLines={2}>
                {job?.title ?? t("deletedPost")}
              </Text>
              <Text style={styles.postedBy}>
                {job?.profiles?.username ?? t("anonymous")}
              </Text>
            </Pressable>
            <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
              <Text style={[styles.statusText, { color: c.text }]}>
                {t(
                  `offer${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`,
                )}
              </Text>
            </View>
          </View>

          {item.cover_letter ? (
            <View style={styles.applicationBox}>
              <Text style={styles.applicationLabel}>
                {t("yourApplication")}
              </Text>
              <Text style={styles.applicationText}>{item.cover_letter}</Text>
            </View>
          ) : null}

          {renderTimeline(item)}

          {item.price != null && (
            <View style={styles.priceChip}>
              <Text style={styles.priceChipText}>
                {t("proposedRateLabel")}: {item.price} {t("rateUnit")}
              </Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <View style={{ gap: 4 }}>
              <Text style={styles.dateText}>
                {new Date(item.created_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              {item.viewed_at ? (
                <Text style={styles.seenText}>{t("applicationSeen")}</Text>
              ) : null}
            </View>
            <View style={styles.footerActions}>
              {item.status === "accepted" && job && (
                <Pressable
                  style={styles.chatBtn}
                  onPress={() => router.push(`/request/${job.id}/chat`)}
                >
                  <Feather name="message-circle" size={14} color="#FFFFFF" />
                  <Text style={styles.chatBtnText}>{t("chat")}</Text>
                </Pressable>
              )}
              {item.status === "accepted" &&
                job &&
                !ratedOfferIds.has(item.id) && (
                  <Pressable
                    style={styles.rateBtn}
                    onPress={() => handleRate(item.id, job.user_id, job.id)}
                  >
                    <Feather name="star" size={13} color={theme.warning} />
                    <Text style={styles.rateBtnText}>
                      {t("rateExperience")}
                    </Text>
                  </Pressable>
                )}
              {item.status === "hired" && job && (
                <Pressable
                  style={styles.disputeBtn}
                  onPress={() => handleDispute(item.id, job.user_id, job.id)}
                >
                  <Feather
                    name="alert-triangle"
                    size={12}
                    color={theme.error}
                  />
                  <Text style={styles.disputeBtnText}>
                    {t("reportOutcome")}
                  </Text>
                </Pressable>
              )}
              {item.status === "pending" && (
                <Pressable
                  style={styles.withdrawBtn}
                  onPress={() => handleWithdraw(item.id)}
                >
                  <Text style={styles.withdrawBtnText}>{t("withdraw")}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }

  function renderReceivedItem({ item }: { item: ReceivedApplication }) {
    const c = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending;
    const job = item.requests;
    const prof = item.profiles;
    const name = prof?.username ?? t("anonymous");
    const avatarLetters = name
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    return (
      <View style={styles.card}>
        <View style={styles.cardBody}>
          {/* Job title + status */}
          <View style={styles.cardHeader}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => job && router.push(`/request/${job.id}`)}
            >
              <Text style={styles.cardTitle} numberOfLines={2}>
                {job?.title ?? t("deletedPost")}
              </Text>
            </Pressable>
            <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
              <Text style={[styles.statusText, { color: c.text }]}>
                {t(
                  `offer${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`,
                )}
              </Text>
            </View>
          </View>

          {/* Candidate profile */}
          <View style={styles.candidateSection}>
            <View style={styles.candidateRow}>
              <View style={styles.candidateAvatar}>
                {prof?.avatar_url ? (
                  <Image
                    source={{ uri: prof.avatar_url }}
                    style={{ width: 56, height: 56, borderRadius: 28 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.candidateAvatarText}>
                    {avatarLetters}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.candidateNameRow}>
                  <Text style={styles.candidateName}>{name}</Text>
                  {prof?.verified && (
                    <View style={styles.verifiedBadge}>
                      <Feather name="check-circle" size={11} color="#0D9488" />
                      <Text style={styles.verifiedText}>{t("verified")}</Text>
                    </View>
                  )}
                </View>
                {prof?.bio ? (
                  <Text style={styles.candidateBio} numberOfLines={2}>
                    {prof.bio}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Skills */}
            {prof?.skills && prof.skills.length > 0 && (
              <View style={styles.skillsRow}>
                {prof.skills.slice(0, 5).map((s) => (
                  <View key={s} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{s}</Text>
                  </View>
                ))}
                {prof.skills.length > 5 && (
                  <Text style={styles.skillMore}>
                    +{prof.skills.length - 5}
                  </Text>
                )}
              </View>
            )}

            {/* View profile */}
            {prof?.id ? (
              <Pressable
                style={styles.cvBtn}
                onPress={() => router.push(`/cv/${prof.id}`)}
              >
                <Feather name="user" size={13} color={theme.primary} />
                <Text style={styles.cvBtnText}>{t("viewCV")}</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Cover letter */}
          {item.cover_letter ? (
            <View style={styles.applicationBox}>
              <Text style={styles.applicationLabel}>{t("coverLetter")}</Text>
              <Text style={styles.applicationText}>{item.cover_letter}</Text>
            </View>
          ) : null}

          {/* Actions */}
          {item.status === "pending" && job && (
            <View style={styles.decisionRow}>
              <Pressable
                style={styles.rejectBtn}
                onPress={() => handleReject(item.id)}
              >
                <Text style={styles.rejectBtnText}>{t("reject")}</Text>
              </Pressable>
              <Pressable
                style={styles.acceptBtn}
                onPress={() => handleAccept(item.id, job.id)}
              >
                <Text style={styles.acceptBtnText}>{t("accept")}</Text>
              </Pressable>
            </View>
          )}
          {item.status === "accepted" && job && (
            <Pressable
              style={[styles.chatBtn, { marginTop: 10 }]}
              onPress={() => router.push(`/request/${job.id}/chat`)}
            >
              <Feather name="message-circle" size={14} color="#FFFFFF" />
              <Text style={styles.chatBtnText}>{t("openChat")}</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  const activeSent = sent.filter(
    (a) => a.status === "pending" || a.status === "accepted",
  );
  const pastSent = sent.filter(
    (a) =>
      a.status === "rejected" ||
      a.status === "withdrawn" ||
      a.status === "hired",
  );

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("myApplications")}</Text>
      </View>

      {/* Tab toggle */}
      <View style={styles.tabRow}>
        {(["sent", "received"] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => {
              setActiveTab(tab);
              if (tab === "received") {
                const unviewedIds = received
                  .filter((r) => !r.viewed_at)
                  .map((r) => r.id);
                markReceivedAsViewed(unviewedIds);
              }
            }}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === tab && styles.tabBtnTextActive,
              ]}
            >
              {t(tab === "sent" ? "sent" : "received")} (
              {tab === "sent" ? sent.length : received.length})
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={theme.primary}
        />
      ) : activeTab === "sent" ? (
        <FlatList
          data={[
            ...activeSent,
            ...(pastSent.length > 0 ? [{ __divider: true } as any] : []),
            ...pastSent,
          ]}
          keyExtractor={(item, i) =>
            item.__divider ? `divider-${i}` : item.id
          }
          renderItem={({ item }) => {
            if (item.__divider) {
              return (
                <View style={styles.sectionDivider}>
                  <View style={styles.sectionLine} />
                  <Text style={styles.sectionLabel}>
                    {t("pastApplications")}
                  </Text>
                  <View style={styles.sectionLine} />
                </View>
              );
            }
            return renderSentItem({ item });
          }}
          contentContainerStyle={[
            styles.list,
            activeSent.length === 0 && pastSent.length === 0 && { flex: 1 },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={fetchData}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Feather name="inbox" size={32} color={theme.mutedText} />
              </View>
              <Text style={styles.emptyTitle}>{t("noApplicationsSent")}</Text>
              <Text style={styles.emptySubtitle}>{t("browseJobsToApply")}</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={received as any[]}
          keyExtractor={(item) => item.id}
          renderItem={renderReceivedItem as any}
          contentContainerStyle={[
            styles.list,
            received.length === 0 && { flex: 1 },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={fetchData}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Feather name="inbox" size={32} color={theme.mutedText} />
              </View>
              <Text style={styles.emptyTitle}>
                {t("noApplicationsReceived")}
              </Text>
              <Text style={styles.emptySubtitle}>{t("postJobToReceive")}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
