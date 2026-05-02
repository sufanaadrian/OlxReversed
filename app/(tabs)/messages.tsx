import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../src/context/LanguageContext";
import { useTheme } from "../../src/context/ThemeContext";
import { supabase } from "../../src/lib/supabase";
import { makeStyles } from "./messages.styles";

type Conversation = {
  requestId: string;
  requestTitle: string;
  otherUserId: string;
  otherUsername: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastMessageIsMe: boolean;
  unreadCount: number;
  iAmOwner: boolean;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function MessagesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const convos: Conversation[] = [];

    // 1. Accepted offers where I am the applicant (seller) — employer accepted me
    const { data: myAccepted } = await supabase
      .from("offers")
      .select(
        "id, request_id, requests!inner(id, title, user_id, status, profiles(id, username))",
      )
      .eq("seller_id", user.id)
      .eq("status", "accepted");

    for (const offer of myAccepted ?? []) {
      const req = (offer as any).requests;
      if (!req) continue;
      const employer = req.profiles;
      const { data: msgs } = await supabase
        .from("messages")
        .select("content, created_at, sender_id, read_at")
        .eq("request_id", req.id)
        .order("created_at", { ascending: false })
        .limit(1);
      const last = msgs?.[0];
      const { count: unread } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("request_id", req.id)
        .neq("sender_id", user.id)
        .is("read_at", null);
      convos.push({
        requestId: req.id,
        requestTitle: req.title,
        otherUserId: employer?.id ?? req.user_id,
        otherUsername: employer?.username ?? null,
        lastMessage: last?.content ?? null,
        lastMessageAt: last?.created_at ?? null,
        lastMessageIsMe: last?.sender_id === user.id,
        unreadCount: unread ?? 0,
        iAmOwner: false,
      });
    }

    // 2. Accepted offers on my posts — I am the employer
    const { data: myPosts } = await supabase
      .from("requests")
      .select("id")
      .eq("user_id", user.id);
    const postIds = (myPosts ?? []).map((p) => p.id);

    if (postIds.length > 0) {
      const { data: acceptedOnMyPosts } = await supabase
        .from("offers")
        .select(
          "id, request_id, seller_id, requests!inner(id, title), profiles!seller_id(id, username)",
        )
        .in("request_id", postIds)
        .eq("status", "accepted");

      for (const offer of acceptedOnMyPosts ?? []) {
        const req = (offer as any).requests;
        const applicant = (offer as any).profiles;
        if (!req) continue;
        const { data: msgs } = await supabase
          .from("messages")
          .select("content, created_at, sender_id, read_at")
          .eq("request_id", req.id)
          .order("created_at", { ascending: false })
          .limit(1);
        const last = msgs?.[0];
        const { count: unread } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("request_id", req.id)
          .neq("sender_id", user.id)
          .is("read_at", null);
        convos.push({
          requestId: req.id,
          requestTitle: req.title,
          otherUserId: applicant?.id ?? offer.seller_id,
          otherUsername: applicant?.username ?? null,
          lastMessage: last?.content ?? null,
          lastMessageAt: last?.created_at ?? null,
          lastMessageIsMe: last?.sender_id === user.id,
          unreadCount: unread ?? 0,
          iAmOwner: true,
        });
      }
    }

    // Sort by most recent activity
    convos.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return (
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
      );
    });

    setConversations(convos);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations]),
  );

  function renderItem({ item }: { item: Conversation }) {
    const initials = (item.otherUsername ?? "?")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const isBuyer = item.iAmOwner;
    const hasUnread = item.unreadCount > 0;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          hasUnread && styles.rowUnread,
          pressed && { opacity: 0.75 },
        ]}
        onPress={() => router.push(`/request/${item.requestId}/chat` as any)}
      >
        {/* Avatar with unread dot */}
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, isBuyer && styles.avatarBuyer]}>
            <Text
              style={[styles.avatarText, isBuyer && styles.avatarTextBuyer]}
            >
              {initials}
            </Text>
          </View>
          {hasUnread && <View style={styles.unreadDot} />}
        </View>

        {/* Content */}
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <View style={styles.nameRow}>
              <Text style={styles.username} numberOfLines={1}>
                {item.otherUsername ?? t("anonymous")}
              </Text>
              <View
                style={[styles.roleBadge, isBuyer && styles.roleBadgeBuyer]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    isBuyer && styles.roleBadgeTextBuyer,
                  ]}
                >
                  {isBuyer ? t("chatRoleBuyer") : t("chatRoleSeller")}
                </Text>
              </View>
            </View>
            {item.lastMessageAt && (
              <Text style={styles.time}>{timeAgo(item.lastMessageAt)}</Text>
            )}
          </View>

          <View style={styles.jobRow}>
            <Feather name="briefcase" size={11} color={colors.mutedText} />
            <Text style={styles.jobTitle} numberOfLines={1}>
              {item.requestTitle}
            </Text>
          </View>

          <Text
            style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
            numberOfLines={1}
          >
            {item.lastMessage
              ? (item.lastMessageIsMe ? `${t("youTyped")}: ` : "") +
                item.lastMessage
              : t("noMessages")}
          </Text>
        </View>

        {/* Right side */}
        <View style={styles.rowRight}>
          {hasUnread ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          ) : (
            <Feather
              name="chevron-right"
              size={18}
              color={colors.mutedText}
              style={styles.chevron}
            />
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.page} edges={[]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("messages")}</Text>
        {conversations.length > 0 && (
          <Text style={styles.headerCount}>{conversations.length}</Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={colors.primary}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.requestId + c.otherUserId}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={[
            styles.listContent,
            conversations.length === 0 && { flex: 1 },
          ]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Feather
                  name="message-circle"
                  size={38}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>{t("noConversations")}</Text>
              <Text style={styles.emptyDesc}>{t("noConversationsDesc")}</Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push("/(tabs)/marketplace" as any)}
              >
                <Text style={styles.emptyBtnText}>{t("marketplace")}</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
