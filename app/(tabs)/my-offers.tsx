import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
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
  created_at: string;
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
  requests: {
    id: string;
    title: string;
  } | null;
  profiles: { username: string | null } | null;
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

    const [{ data: sentData }, { data: receivedData }, { data: myReviews }] =
      await Promise.all([
        supabase
          .from("offers")
          .select(
            "id, status, cover_letter, created_at, requests(id, title, user_id, status, posting_as, profiles(username))",
          )
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("offers")
          .select(
            "id, status, cover_letter, created_at, requests!inner(id, title, user_id), profiles!seller_id(username)",
          )
          .eq("requests.user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("reviews").select("offer_id").eq("reviewer_id", user.id),
      ]);

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

  // Realtime: auto-refresh when own sent offer status changes (accept/reject)
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`offers-status-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "offers",
          filter: `seller_id=eq.${userId}`,
        },
        () => {
          fetchData();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchData]);

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

  function renderSentItem({ item }: { item: Application }) {
    const c = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending;
    const job = item.requests;
    return (
      <Pressable
        style={styles.card}
        onPress={() => job && router.push(`/request/${job.id}`)}
      >
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {job?.title ?? t("deletedPost")}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
              <Text style={[styles.statusText, { color: c.text }]}>
                {t(
                  `offer${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`,
                )}
              </Text>
            </View>
          </View>
          {item.cover_letter ? (
            <Text style={styles.coverLetter} numberOfLines={2}>
              {item.cover_letter}
            </Text>
          ) : null}
          <View style={styles.cardFooter}>
            <Text style={styles.postedBy}>
              {job?.profiles?.username ?? t("anonymous")}
            </Text>
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
      </Pressable>
    );
  }

  function renderReceivedItem({ item }: { item: ReceivedApplication }) {
    const c = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending;
    const job = item.requests;
    return (
      <View style={styles.card}>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {job?.title ?? t("deletedPost")}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
              <Text style={[styles.statusText, { color: c.text }]}>
                {t(
                  `offer${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`,
                )}
              </Text>
            </View>
          </View>
          <Text style={styles.applicantName}>
            {(item as any).profiles?.username ?? t("anonymous")}
          </Text>
          {item.cover_letter ? (
            <Text style={styles.coverLetter} numberOfLines={3}>
              {item.cover_letter}
            </Text>
          ) : null}
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
              style={styles.chatBtn}
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
    (a) => a.status === "rejected" || a.status === "withdrawn",
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
            onPress={() => setActiveTab(tab)}
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
