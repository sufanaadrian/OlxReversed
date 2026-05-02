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
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../src/context/LanguageContext";
import { requireAuth } from "../../src/lib/authGuard";
import { supabase } from "../../src/lib/supabase";
import { styles, theme } from "./activity.styles";

// ─── Types ───────────────────────────────────────────────────────────────────

type JobPost = {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  status: string;
  posting_as: string | null;
  created_at: string;
  is_urgent: boolean;
  is_boosted: boolean;
  boosted_until: string | null;
  offer_count: number;
};

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
  requests: { id: string; title: string } | null;
  profiles: {
    id: string;
    username: string | null;
    bio: string | null;
    skills: string[] | null;
    linkedin_url: string | null;
    verified: boolean | null;
  } | null;
};

const POST_STATUS_COLOR: Record<string, string> = {
  active: theme.success,
  filled: theme.primary,
  closed: theme.mutedText,
};

const APP_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: theme.warningLight, text: theme.warning },
  accepted: { bg: theme.successLight, text: theme.success },
  rejected: { bg: theme.errorLight, text: theme.error },
  withdrawn: { bg: theme.surfaceAlt, text: theme.mutedText },
};

type MainTab = "posts" | "applications";
type AppTab = "sent" | "received";

// ─── Component ───────────────────────────────────────────────────────────────

export default function ActivityScreen() {
  const t = useTranslation();
  const [mainTab, setMainTab] = useState<MainTab>("posts");
  const [appTab, setAppTab] = useState<AppTab>("sent");

  // Posts state
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Applications state
  const [sentApps, setSentApps] = useState<Application[]>([]);
  const [receivedApps, setReceivedApps] = useState<ReceivedApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [expandedLetters, setExpandedLetters] = useState<Set<string>>(
    new Set(),
  );

  function toggleLetter(id: string) {
    setExpandedLetters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Fetch Posts ──

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      requireAuth();
      return;
    }
    const { data: rows } = await supabase
      .from("requests")
      .select(
        "id, title, category, location, status, posting_as, created_at, is_urgent, is_boosted, boosted_until",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const ids = (rows ?? []).map((r) => r.id);
    let counts: Record<string, number> = {};
    if (ids.length > 0) {
      const { data: offerRows } = await supabase
        .from("offers")
        .select("request_id")
        .in("request_id", ids)
        .neq("status", "withdrawn");
      (offerRows ?? []).forEach((o) => {
        counts[o.request_id] = (counts[o.request_id] ?? 0) + 1;
      });
    }
    setPosts(
      (rows ?? []).map((r) => ({ ...r, offer_count: counts[r.id] ?? 0 })),
    );
    setPostsLoading(false);
  }, []);

  // ── Fetch Applications ──

  const fetchApplications = useCallback(async () => {
    setAppsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      requireAuth();
      return;
    }

    // Sent
    const { data: sent } = await supabase
      .from("offers")
      .select(
        "id, status, cover_letter, created_at, requests!inner(id, title, user_id, status, posting_as)",
      )
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    // Sent apps — fetch employer profile separately
    const sentWithProfiles: Application[] = [];
    for (const app of sent ?? []) {
      const req = (app as any).requests;
      if (req?.user_id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", req.user_id)
          .single();
        sentWithProfiles.push({
          ...app,
          requests: req ? { ...req, profiles: prof ?? null } : null,
        } as Application);
      } else {
        sentWithProfiles.push(app as Application);
      }
    }
    setSentApps(sentWithProfiles);

    // Received (on my posts)
    const { data: myPosts } = await supabase
      .from("requests")
      .select("id")
      .eq("user_id", user.id);
    const postIds = (myPosts ?? []).map((p) => p.id);
    if (postIds.length > 0) {
      const { data: received } = await supabase
        .from("offers")
        .select(
          "id, status, cover_letter, created_at, requests!inner(id, title), profiles!seller_id(id, username, bio, skills, linkedin_url, verified)",
        )
        .in("request_id", postIds)
        .neq("status", "withdrawn")
        .order("created_at", { ascending: false });
      setReceivedApps((received as ReceivedApplication[]) ?? []);
    } else {
      setReceivedApps([]);
    }
    setAppsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
      fetchApplications();
    }, [fetchPosts, fetchApplications]),
  );

  // ── Helpers ──

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  }

  async function deletePost(id: string) {
    Alert.alert(t("deletePost"), t("deletePostConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          await supabase.from("requests").delete().eq("id", id);
          fetchPosts();
        },
      },
    ]);
  }

  async function withdrawApp(id: string) {
    Alert.alert(t("withdraw"), t("withdrawConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("withdraw"),
        style: "destructive",
        onPress: async () => {
          await supabase
            .from("offers")
            .update({ status: "withdrawn" })
            .eq("id", id);
          fetchApplications();
        },
      },
    ]);
  }

  // ── Render helpers ──

  function renderPost({ item }: { item: JobPost }) {
    const color = POST_STATUS_COLOR[item.status] ?? theme.mutedText;
    const isBoosted =
      item.is_boosted &&
      item.boosted_until &&
      new Date(item.boosted_until) > new Date();
    return (
      <Pressable
        style={[styles.card, isBoosted && styles.cardBoosted]}
        onPress={() => router.push(`/request/${item.id}` as any)}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
        </View>
        <View style={styles.cardMeta}>
          {item.category ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{item.category}</Text>
            </View>
          ) : null}
          {item.location ? (
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={11} color={theme.mutedText} />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Feather name="clock" size={11} color={theme.mutedText} />
            <Text style={styles.metaText}>{timeAgo(item.created_at)}</Text>
          </View>
          {item.offer_count > 0 && (
            <View style={styles.metaItem}>
              <Feather name="users" size={11} color={theme.primary} />
              <Text style={[styles.metaText, { color: theme.primary }]}>
                {item.offer_count}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.cardActions}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push(`/request/${item.id}` as any)}
          >
            <Feather name="eye" size={13} color={theme.primary} />
            <Text style={styles.actionBtnText}>{t("view")}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={() => deletePost(item.id)}
          >
            <Feather name="trash-2" size={13} color={theme.error} />
            <Text style={[styles.actionBtnText, { color: theme.error }]}>
              {t("delete")}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    );
  }

  function renderSentApp({ item }: { item: Application }) {
    const col = APP_STATUS_COLORS[item.status] ?? APP_STATUS_COLORS.pending;
    const req = item.requests;
    const canChat = item.status === "accepted" && req;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {req?.title ?? "—"}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: col.bg }]}>
            <Text style={[styles.statusBadgeText, { color: col.text }]}>
              {t(item.status)}
            </Text>
          </View>
        </View>
        {req?.profiles?.username ? (
          <Text style={styles.cardSub}>
            {t("by")} {req.profiles.username}
          </Text>
        ) : null}
        {item.cover_letter ? (
          <Pressable
            style={styles.coverLetterBox}
            onPress={() => toggleLetter(item.id)}
          >
            <Text
              style={styles.coverLetterText}
              numberOfLines={expandedLetters.has(item.id) ? undefined : 2}
            >
              {item.cover_letter}
            </Text>
            {item.cover_letter.split("\n").join(" ").length > 80 && (
              <View style={styles.coverLetterChevron}>
                <Feather
                  name={
                    expandedLetters.has(item.id) ? "chevron-up" : "chevron-down"
                  }
                  size={13}
                  color={theme.primary}
                />
              </View>
            )}
          </Pressable>
        ) : null}
        <View style={styles.cardActions}>
          {req && (
            <Pressable
              style={styles.actionBtn}
              onPress={() => router.push(`/request/${req.id}` as any)}
            >
              <Feather name="eye" size={13} color={theme.primary} />
              <Text style={styles.actionBtnText}>{t("viewPost")}</Text>
            </Pressable>
          )}
          {canChat && (
            <Pressable
              style={styles.chatBtn}
              onPress={() => router.push(`/request/${req.id}/chat` as any)}
            >
              <Feather name="message-circle" size={13} color="#fff" />
              <Text style={styles.chatBtnText}>{t("openChat")}</Text>
            </Pressable>
          )}
          {item.status === "pending" && (
            <Pressable
              style={[styles.actionBtn, styles.actionBtnDanger]}
              onPress={() => withdrawApp(item.id)}
            >
              <Text style={[styles.actionBtnText, { color: theme.error }]}>
                {t("withdraw")}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  function renderReceivedApp({ item }: { item: ReceivedApplication }) {
    const col = APP_STATUS_COLORS[item.status] ?? APP_STATUS_COLORS.pending;
    const req = item.requests;
    const prof = item.profiles;
    return (
      <Pressable
        style={styles.card}
        onPress={() => req && router.push(`/request/${req.id}` as any)}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {req?.title ?? "—"}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: col.bg }]}>
            <Text style={[styles.statusBadgeText, { color: col.text }]}>
              {t(item.status)}
            </Text>
          </View>
        </View>
        {prof?.username ? (
          <Text style={styles.cardSub}>{prof.username}</Text>
        ) : null}
        {item.cover_letter ? (
          <Pressable
            style={styles.coverLetterBox}
            onPress={() => toggleLetter(item.id)}
          >
            <Text
              style={styles.coverLetterText}
              numberOfLines={expandedLetters.has(item.id) ? undefined : 2}
            >
              {item.cover_letter}
            </Text>
            {item.cover_letter.split("\n").join(" ").length > 80 && (
              <View style={styles.coverLetterChevron}>
                <Feather
                  name={
                    expandedLetters.has(item.id) ? "chevron-up" : "chevron-down"
                  }
                  size={13}
                  color={theme.primary}
                />
              </View>
            )}
          </Pressable>
        ) : null}
        <View style={styles.cardActions}>
          {prof?.id && (
            <Pressable
              style={styles.actionBtn}
              onPress={() => router.push(`/cv/${prof.id}` as any)}
            >
              <Feather name="user" size={13} color={theme.primary} />
              <Text style={styles.actionBtnText}>{t("viewCV")}</Text>
            </Pressable>
          )}
          {item.status === "accepted" && req && (
            <Pressable
              style={styles.chatBtn}
              onPress={() => router.push(`/request/${req.id}/chat` as any)}
            >
              <Feather name="message-circle" size={13} color="#fff" />
              <Text style={styles.chatBtnText}>{t("openChat")}</Text>
            </Pressable>
          )}
          {item.status === "pending" && (
            <>
              <Pressable
                style={styles.chatBtn}
                onPress={async () => {
                  await supabase
                    .from("offers")
                    .update({ status: "accepted" })
                    .eq("id", item.id);
                  fetchApplications();
                }}
              >
                <Text style={styles.chatBtnText}>{t("accept")}</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.actionBtnDanger]}
                onPress={async () => {
                  await supabase
                    .from("offers")
                    .update({ status: "rejected" })
                    .eq("id", item.id);
                  fetchApplications();
                }}
              >
                <Text style={[styles.actionBtnText, { color: theme.error }]}>
                  {t("reject")}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </Pressable>
    );
  }

  const isLoading = mainTab === "posts" ? postsLoading : appsLoading;

  return (
    <SafeAreaView style={styles.page} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("activity")}</Text>
      </View>

      {/* Main tab pill */}
      <View style={styles.mainTabRow}>
        <Pressable
          style={[
            styles.mainTabBtn,
            mainTab === "posts" && styles.mainTabBtnActive,
          ]}
          onPress={() => setMainTab("posts")}
        >
          <Feather
            name="file-text"
            size={14}
            color={mainTab === "posts" ? theme.primary : theme.mutedText}
          />
          <Text
            style={[
              styles.mainTabText,
              mainTab === "posts" && styles.mainTabTextActive,
            ]}
          >
            {t("myPosts")}
          </Text>
          {posts.length > 0 && (
            <View style={styles.mainTabBadge}>
              <Text style={styles.mainTabBadgeText}>{posts.length}</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          style={[
            styles.mainTabBtn,
            mainTab === "applications" && styles.mainTabBtnActive,
          ]}
          onPress={() => setMainTab("applications")}
        >
          <Feather
            name="inbox"
            size={14}
            color={mainTab === "applications" ? theme.primary : theme.mutedText}
          />
          <Text
            style={[
              styles.mainTabText,
              mainTab === "applications" && styles.mainTabTextActive,
            ]}
          >
            {t("myApplications")}
          </Text>
          {(sentApps.length > 0 || receivedApps.length > 0) && (
            <View style={styles.mainTabBadge}>
              <Text style={styles.mainTabBadgeText}>
                {sentApps.length + receivedApps.length}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Applications sub-tab */}
      {mainTab === "applications" && (
        <View style={styles.subTabRow}>
          <Pressable
            style={[
              styles.subTabBtn,
              appTab === "sent" && styles.subTabBtnActive,
            ]}
            onPress={() => setAppTab("sent")}
          >
            <Text
              style={[
                styles.subTabText,
                appTab === "sent" && styles.subTabTextActive,
              ]}
            >
              {t("sent")} {sentApps.length > 0 ? `(${sentApps.length})` : ""}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.subTabBtn,
              appTab === "received" && styles.subTabBtnActive,
            ]}
            onPress={() => setAppTab("received")}
          >
            <Text
              style={[
                styles.subTabText,
                appTab === "received" && styles.subTabTextActive,
              ]}
            >
              {t("received")}{" "}
              {receivedApps.length > 0 ? `(${receivedApps.length})` : ""}
            </Text>
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={theme.primary}
        />
      ) : mainTab === "posts" ? (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={renderPost}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="file-text" size={40} color={theme.border} />
              <Text style={styles.emptyText}>{t("noPostsYet")}</Text>
            </View>
          }
        />
      ) : appTab === "sent" ? (
        <FlatList
          data={sentApps}
          keyExtractor={(a) => a.id}
          renderItem={renderSentApp}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="inbox" size={40} color={theme.border} />
              <Text style={styles.emptyText}>{t("noApplicationsYet")}</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={receivedApps}
          keyExtractor={(a) => a.id}
          renderItem={renderReceivedApp}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="users" size={40} color={theme.border} />
              <Text style={styles.emptyText}>{t("noApplicationsYet")}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
