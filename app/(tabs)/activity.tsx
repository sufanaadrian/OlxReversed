import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Pressable,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserAvatar } from "../../src/components/UserAvatar";
import { useTranslation } from "../../src/context/LanguageContext";
import { useTheme } from "../../src/context/ThemeContext";
import { requireAuth } from "../../src/lib/authGuard";
import { supabase } from "../../src/lib/supabase";
import type { Colors } from "../../src/theme/colors";
import { makeStyles } from "./activity.styles";

function getPostStatusColor(c: Colors): Record<string, string> {
  return { active: c.success, filled: c.primary, closed: c.mutedText };
}

function getAppStatusColors(
  c: Colors,
): Record<string, { bg: string; text: string }> {
  return {
    pending: { bg: c.warningLight, text: c.warning },
    accepted: { bg: c.primaryLight, text: c.primaryDark },
    hired: { bg: c.successLight, text: c.success },
    rejected: { bg: c.errorLight, text: c.error },
    withdrawn: { bg: c.surfaceAlt, text: c.mutedText },
  };
}

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
  price: number | null;
  created_at: string;
  viewed_at: string | null;
  requests: {
    id: string;
    title: string;
    user_id: string;
    status: string;
    posting_as: string | null;
    profiles: { username: string | null; avatar_url: string | null } | null;
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
    workers_needed: number;
    accepted_count: number;
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

type MainTab = "posts" | "applications";
type AppTab = "sent" | "received" | "invitations";

type Invitation = {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  requests: {
    id: string;
    title: string;
    category: string | null;
    location: string | null;
    profiles: { username: string | null; avatar_url: string | null } | null;
  } | null;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ActivityScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useTranslation();
  const [mainTab, setMainTab] = useState<MainTab>("posts");
  const [appTab, setAppTab] = useState<AppTab>("sent");

  // Posts state
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Applications state
  const [sentApps, setSentApps] = useState<Application[]>([]);
  const [receivedApps, setReceivedApps] = useState<ReceivedApplication[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
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
        "id, status, cover_letter, price, created_at, viewed_at, requests!inner(id, title, user_id, status, posting_as)",
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
          .select("username, avatar_url")
          .eq("id", req.user_id)
          .single();
        sentWithProfiles.push({
          ...app,
          requests: req ? { ...req, profiles: prof ?? null } : null,
        } as unknown as Application);
      } else {
        sentWithProfiles.push(app as unknown as Application);
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
          "id, status, cover_letter, created_at, viewed_at, requests!inner(id, title, workers_needed, accepted_count), profiles!seller_id(id, username, bio, skills, linkedin_url, verified, avatar_url)",
        )
        .in("request_id", postIds)
        .neq("status", "withdrawn")
        .order("created_at", { ascending: false });
      setReceivedApps((received as unknown as ReceivedApplication[]) ?? []);
    } else {
      setReceivedApps([]);
    }

    // Invitations (sent to me as a student)
    const { data: invites } = await supabase
      .from("invitations")
      .select(
        "id, status, message, created_at, requests!inner(id, title, category, location, profiles!user_id(username, avatar_url))",
      )
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });
    setInvitations((invites as unknown as Invitation[]) ?? []);

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

  // Slot-guarded accept: invite to chat without counting toward filled
  async function handleAcceptReceived(item: ReceivedApplication) {
    const req = item.requests;
    if (!req) return;
    const chattingCount = receivedApps.filter(
      (a) => a.requests?.id === req.id && a.status === "accepted",
    ).length;
    const canAccept =
      chattingCount + (req.accepted_count ?? 0) < (req.workers_needed ?? 1);
    if (!canAccept) return;
    await supabase
      .from("offers")
      .update({ status: "accepted" })
      .eq("id", item.id);
    fetchApplications();
  }

  async function handleHireReceived(item: ReceivedApplication) {
    const req = item.requests;
    if (!req) return;
    Alert.alert(t("hire"), t("hireConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("hire"),
        onPress: async () => {
          await supabase
            .from("offers")
            .update({ status: "hired" })
            .eq("id", item.id);
          const newCount = (req.accepted_count ?? 0) + 1;
          const nowFilled = newCount >= (req.workers_needed ?? 1);
          await supabase
            .from("requests")
            .update({
              accepted_count: newCount,
              ...(nowFilled ? { status: "filled" } : {}),
            })
            .eq("id", req.id);
          fetchApplications();
        },
      },
    ]);
  }

  async function markReceivedAsViewed(offerIds: string[]) {
    if (!offerIds.length) return;
    await supabase
      .from("offers")
      .update({ viewed_at: new Date().toISOString() })
      .in("id", offerIds)
      .is("viewed_at", null);
  }

  async function handleReleaseReceived(item: ReceivedApplication) {
    Alert.alert(t("release"), t("releaseConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("release"),
        style: "destructive",
        onPress: async () => {
          await supabase
            .from("offers")
            .update({ status: "rejected" })
            .eq("id", item.id);
          fetchApplications();
        },
      },
    ]);
  }

  // ── Render helpers ──

  function renderPost({ item }: { item: JobPost }) {
    const postStatusColor = getPostStatusColor(colors);
    const color = postStatusColor[item.status] ?? colors.mutedText;
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
              <Feather name="map-pin" size={11} color={colors.mutedText} />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Feather name="clock" size={11} color={colors.mutedText} />
            <Text style={styles.metaText}>{timeAgo(item.created_at)}</Text>
          </View>
          {item.offer_count > 0 && (
            <View style={styles.metaItem}>
              <Feather name="users" size={11} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.primary }]}>
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
            <Feather name="eye" size={13} color={colors.primary} />
            <Text style={styles.actionBtnText}>{t("view")}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={() => deletePost(item.id)}
          >
            <Feather name="trash-2" size={13} color={colors.error} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>
              {t("delete")}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    );
  }

  function renderTimeline(item: Application) {
    const steps = [
      { key: "timelineApplied", done: true, color: colors.success },
      { key: "timelineSeen", done: !!item.viewed_at, color: colors.success },
      {
        key: "timelineShortlisted",
        done: item.status === "accepted" || item.status === "hired",
        color: colors.success,
      },
      {
        key: "timelineDecision",
        done:
          item.status === "hired" ||
          item.status === "rejected" ||
          item.status === "withdrawn",
        color:
          item.status === "rejected"
            ? colors.error
            : item.status === "withdrawn"
              ? colors.mutedText
              : colors.success,
      },
    ];
    return (
      <View style={styles.timeline}>
        <Text style={styles.timelineSectionLabel}>
          {t("applicationStatus")}
        </Text>
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
                    steps[i + 1].done && { backgroundColor: colors.success },
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
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

  function renderInvitation({ item }: { item: Invitation }) {
    const req = item.requests;
    const isPending = item.status === "pending";
    const isAccepted = item.status === "accepted";
    const isDeclined = item.status === "declined";
    const posterName = req?.profiles?.username ?? null;

    return (
      <View
        style={[
          styles.appCard,
          isDeclined && styles.appCardDim,
        ]}
      >
        <View
          style={[
            styles.appStatusBar,
            {
              backgroundColor: isPending
                ? colors.warning
                : isAccepted
                  ? colors.primary
                  : colors.mutedText,
            },
          ]}
        />
        <View style={styles.appCardInner}>
          <View style={styles.appCardTop}>
            <View
              style={[
                styles.appAvatar,
                { backgroundColor: colors.employerLight },
              ]}
            >
              {req?.profiles?.avatar_url ? (
                <Image
                  source={{ uri: req.profiles.avatar_url }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                  resizeMode="cover"
                />
              ) : (
                <Feather name="briefcase" size={18} color={colors.employer} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.appJobTitle} numberOfLines={2}>
                {req?.title ?? "—"}
              </Text>
              {posterName ? (
                <Text style={styles.appEmployerName}>{posterName}</Text>
              ) : null}
            </View>
            <View
              style={[
                styles.appStatusBadge,
                {
                  backgroundColor: isPending
                    ? colors.warningLight
                    : isAccepted
                      ? colors.primaryLight
                      : colors.surfaceAlt,
                },
              ]}
            >
              <Text
                style={[
                  styles.appStatusText,
                  {
                    color: isPending
                      ? colors.warning
                      : isAccepted
                        ? colors.primaryDark
                        : colors.mutedText,
                  },
                ]}
              >
                {t(
                  isPending
                    ? "invitePending"
                    : isAccepted
                      ? "inviteAccepted"
                      : "inviteDeclined",
                )}
              </Text>
            </View>
          </View>

          {item.message ? (
            <Text style={styles.appCoverLetterText}>{item.message}</Text>
          ) : null}

          <Text style={styles.appTimestamp}>{timeAgo(item.created_at)}</Text>

          {isPending && req ? (
            <View style={styles.appActions}>
              <Pressable
                style={styles.appActionGhost}
                onPress={() => router.push(`/request/${req.id}` as any)}
              >
                <Feather name="eye" size={13} color={colors.secondaryText} />
                <Text style={styles.appActionGhostText}>{t("viewPost")}</Text>
              </Pressable>
              <Pressable
                style={styles.appActionPrimary}
                onPress={async () => {
                  await supabase
                    .from("invitations")
                    .update({ status: "accepted" })
                    .eq("id", item.id);
                  fetchApplications();
                  router.push({
                    pathname: "/(modals)/create-offer",
                    params: { requestId: req.id, title: req.title },
                  } as any);
                }}
              >
                <Feather name="check" size={13} color="#fff" />
                <Text style={styles.appActionPrimaryText}>
                  {t("acceptAndApply")}
                </Text>
              </Pressable>
              <Pressable
                style={styles.appActionDanger}
                onPress={async () => {
                  await supabase
                    .from("invitations")
                    .update({ status: "declined" })
                    .eq("id", item.id);
                  fetchApplications();
                }}
              >
                <Text style={styles.appActionDangerText}>{t("decline")}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  function renderSentApp({ item }: { item: Application }) {
    const appStatusColors = getAppStatusColors(colors);
    const col = appStatusColors[item.status] ?? appStatusColors.pending;
    const req = item.requests;
    const canChat =
      (item.status === "accepted" || item.status === "hired") && req;
    const isWithdrawn = item.status === "withdrawn";
    const employerName = req?.profiles?.username ?? null;

    return (
      <View style={[styles.appCard, isWithdrawn && styles.appCardDim]}>
        <View style={[styles.appStatusBar, { backgroundColor: col.text }]} />
        <View style={styles.appCardInner}>
          {/* Top: avatar + title + status */}
          <View style={styles.appCardTop}>
            <UserAvatar
              style={[styles.appAvatar, { backgroundColor: col.bg }]}
              textStyle={[styles.appAvatarText, { color: col.text }]}
              avatarUrl={req?.profiles?.avatar_url}
              name={employerName}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.appJobTitle} numberOfLines={2}>
                {req?.title ?? "—"}
              </Text>
              {employerName ? (
                <Text style={styles.appEmployerName}>{employerName}</Text>
              ) : null}
            </View>
            <View style={[styles.appStatusBadge, { backgroundColor: col.bg }]}>
              <Text style={[styles.appStatusText, { color: col.text }]}>
                {t(item.status)}
              </Text>
            </View>
          </View>

          <Text style={styles.appTimestamp}>
            {t("appliedOn")} · {timeAgo(item.created_at)}
          </Text>

          {/* Cover letter */}
          {item.cover_letter ? (
            <Pressable
              style={styles.appCoverLetter}
              onPress={() => toggleLetter(item.id)}
            >
              <Feather
                name="file-text"
                size={12}
                color={colors.mutedText}
                style={{ marginTop: 1 }}
              />
              <Text
                style={styles.appCoverLetterText}
                numberOfLines={expandedLetters.has(item.id) ? undefined : 2}
              >
                {item.cover_letter}
              </Text>
              {item.cover_letter.length > 100 && (
                <Feather
                  name={
                    expandedLetters.has(item.id) ? "chevron-up" : "chevron-down"
                  }
                  size={13}
                  color={colors.mutedText}
                />
              )}
            </Pressable>
          ) : null}

          {renderTimeline(item)}

          {/* Actions */}
          {!isWithdrawn && (
            <View style={styles.appActions}>
              {req && (
                <Pressable
                  style={styles.appActionGhost}
                  onPress={() => router.push(`/request/${req.id}` as any)}
                >
                  <Feather name="eye" size={13} color={colors.secondaryText} />
                  <Text style={styles.appActionGhostText}>{t("viewPost")}</Text>
                </Pressable>
              )}
              {canChat && (
                <Pressable
                  style={styles.appActionPrimary}
                  onPress={() => router.push(`/request/${req.id}/chat` as any)}
                >
                  <Feather name="message-circle" size={13} color="#fff" />
                  <Text style={styles.appActionPrimaryText}>
                    {t("openChat")}
                  </Text>
                </Pressable>
              )}
              {item.status === "pending" && (
                <Pressable
                  style={styles.appActionDanger}
                  onPress={() => withdrawApp(item.id)}
                >
                  <Text style={styles.appActionDangerText}>
                    {t("withdraw")}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    );
  }

  function renderReceivedApp({ item }: { item: ReceivedApplication }) {
    const appStatusColors = getAppStatusColors(colors);
    const col = appStatusColors[item.status] ?? appStatusColors.pending;
    const req = item.requests;
    const prof = item.profiles;
    const isVerified = prof?.verified;
    function initials(n: string | null) {
      if (!n) return "?";
      return n
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }

    return (
      <View style={styles.appCard}>
        <View style={[styles.appStatusBar, { backgroundColor: col.text }]} />
        <View style={styles.appCardInner}>
          {/* Top: applicant avatar + name + status */}
          <View style={styles.appCardTop}>
            <Pressable
              style={[
                styles.appAvatar,
                { backgroundColor: colors.primaryLight, overflow: "hidden" },
              ]}
              onPress={() => prof?.id && router.push(`/cv/${prof.id}` as any)}
            >
              {prof?.avatar_url ? (
                <Image
                  source={{ uri: prof.avatar_url }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={[styles.appAvatarText, { color: colors.primary }]}>
                  {initials(prof?.username ?? null)}
                </Text>
              )}
            </Pressable>
            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <Text style={styles.appJobTitle} numberOfLines={1}>
                  {prof?.username ?? t("anonymous")}
                </Text>
                {isVerified && (
                  <Feather
                    name="check-circle"
                    size={13}
                    color={colors.primary}
                  />
                )}
              </View>
              <Text style={styles.appEmployerName} numberOfLines={1}>
                {req?.title ?? "—"}
              </Text>
            </View>
            <View style={[styles.appStatusBadge, { backgroundColor: col.bg }]}>
              <Text style={[styles.appStatusText, { color: col.text }]}>
                {t(item.status)}
              </Text>
            </View>
          </View>

          {/* Skills */}
          {prof?.skills && prof.skills.length > 0 && (
            <View style={styles.appSkillsRow}>
              {prof.skills.slice(0, 4).map((s) => (
                <View key={s} style={styles.appSkillChip}>
                  <Text style={styles.appSkillText}>{s}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.appTimestamp}>{timeAgo(item.created_at)}</Text>

          {/* Cover letter */}
          {item.cover_letter ? (
            <Pressable
              style={styles.appCoverLetter}
              onPress={() => toggleLetter(item.id)}
            >
              <Feather
                name="file-text"
                size={12}
                color={colors.mutedText}
                style={{ marginTop: 1 }}
              />
              <Text
                style={styles.appCoverLetterText}
                numberOfLines={expandedLetters.has(item.id) ? undefined : 2}
              >
                {item.cover_letter}
              </Text>
              {item.cover_letter.length > 100 && (
                <Feather
                  name={
                    expandedLetters.has(item.id) ? "chevron-up" : "chevron-down"
                  }
                  size={13}
                  color={colors.mutedText}
                />
              )}
            </Pressable>
          ) : null}

          {/* Actions */}
          <View style={styles.appActions}>
            {prof?.id && (
              <Pressable
                style={styles.appActionGhost}
                onPress={() => router.push(`/cv/${prof.id}` as any)}
              >
                <Feather name="user" size={13} color={colors.secondaryText} />
                <Text style={styles.appActionGhostText}>{t("viewCV")}</Text>
              </Pressable>
            )}
            {(item.status === "accepted" || item.status === "hired") && req && (
              <>
                <Pressable
                  style={styles.appActionPrimary}
                  onPress={() => router.push(`/request/${req.id}/chat` as any)}
                >
                  <Feather name="message-circle" size={13} color="#fff" />
                  <Text style={styles.appActionPrimaryText}>
                    {t("openChat")}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.appActionPrimary}
                  onPress={() => handleHireReceived(item)}
                >
                  <Feather name="check" size={13} color="#fff" />
                  <Text style={styles.appActionPrimaryText}>{t("hire")}</Text>
                </Pressable>
                <Pressable
                  style={styles.appActionDanger}
                  onPress={() => handleReleaseReceived(item)}
                >
                  <Text style={styles.appActionDangerText}>{t("release")}</Text>
                </Pressable>
              </>
            )}
            {item.status === "pending" &&
              (() => {
                const req = item.requests;
                const chattingCount = receivedApps.filter(
                  (a) => a.requests?.id === req?.id && a.status === "accepted",
                ).length;
                const canAccept =
                  !!req &&
                  chattingCount + (req.accepted_count ?? 0) <
                    (req.workers_needed ?? 1);
                return (
                  <>
                    <Pressable
                      style={[
                        styles.appActionPrimary,
                        !canAccept && { opacity: 0.4 },
                      ]}
                      onPress={() => {
                        if (!canAccept) {
                          Alert.alert(t("slotsFull"), t("slotsFullHint"));
                          return;
                        }
                        handleAcceptReceived(item);
                      }}
                    >
                      <Feather name="message-circle" size={13} color="#fff" />
                      <Text style={styles.appActionPrimaryText}>
                        {t("accept")}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.appActionDanger}
                      onPress={async () => {
                        await supabase
                          .from("offers")
                          .update({ status: "rejected" })
                          .eq("id", item.id);
                        fetchApplications();
                      }}
                    >
                      <Text style={styles.appActionDangerText}>
                        {t("reject")}
                      </Text>
                    </Pressable>
                  </>
                );
              })()}
          </View>
        </View>
      </View>
    );
  }

  const isLoading = mainTab === "posts" ? postsLoading : appsLoading;

  return (
    <SafeAreaView style={styles.page} edges={[]}>
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
            color={mainTab === "posts" ? colors.primary : colors.mutedText}
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
            color={
              mainTab === "applications" ? colors.primary : colors.mutedText
            }
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
          {invitations.filter((i) => i.status === "pending").length > 0 && (
            <View style={[styles.mainTabBadge, { backgroundColor: colors.warningLight }]}>
              <Text style={[styles.mainTabBadgeText, { color: colors.warning }]}>
                {invitations.filter((i) => i.status === "pending").length}
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
            onPress={() => {
              setAppTab("received");
              const unviewedIds = receivedApps
                .filter((r) => !r.viewed_at)
                .map((r) => r.id);
              markReceivedAsViewed(unviewedIds);
            }}
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
          {invitations.length > 0 && (
            <Pressable
              style={[
                styles.subTabBtn,
                appTab === "invitations" && styles.subTabBtnActive,
              ]}
              onPress={() => setAppTab("invitations")}
            >
              <Text
                style={[
                  styles.subTabText,
                  appTab === "invitations" && styles.subTabTextActive,
                ]}
              >
                {t("invitations")}{" "}
                {invitations.filter((i) => i.status === "pending").length > 0
                  ? `(${invitations.filter((i) => i.status === "pending").length})`
                  : ""}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={colors.primary}
        />
      ) : mainTab === "posts" ? (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={renderPost}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="file-text" size={40} color={colors.border} />
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
              <Feather name="inbox" size={40} color={colors.border} />
              <Text style={styles.emptyText}>{t("noApplicationsYet")}</Text>
            </View>
          }
        />
      ) : appTab === "invitations" ? (
        <FlatList
          data={invitations}
          keyExtractor={(a) => a.id}
          renderItem={renderInvitation}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="mail" size={40} color={colors.border} />
              <Text style={styles.emptyText}>{t("noInvitations")}</Text>
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
              <Feather name="users" size={40} color={colors.border} />
              <Text style={styles.emptyText}>{t("noApplicationsYet")}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
