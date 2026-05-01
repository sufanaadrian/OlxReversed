import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { requireAuth(); return; }
    setUserId(user.id);

    const [{ data: sentData }, { data: receivedData }] = await Promise.all([
      supabase
        .from("offers")
        .select("id, status, cover_letter, created_at, requests(id, title, user_id, status, posting_as, profiles(username))")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("offers")
        .select("id, status, cover_letter, created_at, requests!inner(id, title, user_id), profiles!seller_id(username)")
        .eq("requests.user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setSent((sentData as unknown as Application[]) ?? []);
    setReceived((receivedData as unknown as ReceivedApplication[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  async function handleWithdraw(offerId: string) {
    Alert.alert(t("withdrawApplication"), t("withdrawConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("withdraw"),
        style: "destructive",
        onPress: async () => {
          await supabase.from("offers").update({ status: "withdrawn" }).eq("id", offerId);
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
    await supabase.from("offers").update({ status: "rejected" }).eq("id", offerId);
    fetchData();
  }

  function renderSentItem({ item }: { item: Application }) {
    const c = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending;
    const job = item.requests;
    return (
      <Pressable style={styles.card} onPress={() => job && router.push(`/request/${job.id}`)}>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {job?.title ?? t("deletedPost")}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
              <Text style={[styles.statusText, { color: c.text }]}>
                {t(`offer${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`)}
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
              {item.status === "pending" && (
                <Pressable style={styles.withdrawBtn} onPress={() => handleWithdraw(item.id)}>
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
                {t(`offer${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`)}
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

  const data = activeTab === "sent" ? sent : received;
  const isEmpty = data.length === 0;

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
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {t(tab === "sent" ? "sent" : "received")}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.primary} />
      ) : (
        <FlatList
          data={data as any[]}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === "sent" ? renderSentItem as any : renderReceivedItem as any}
          contentContainerStyle={[styles.list, isEmpty && { flex: 1 }]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={fetchData}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Feather name="inbox" size={32} color={theme.mutedText} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === "sent" ? t("noApplicationsSent") : t("noApplicationsReceived")}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === "sent" ? t("browseJobsToApply") : t("postJobToReceive")}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
