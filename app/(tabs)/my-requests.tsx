import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
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
import { styles, theme } from "./my-requests.styles";

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

const STATUS_COLOR: Record<string, string> = {
  active: theme.success,
  filled: theme.primary,
  closed: theme.mutedText,
};

export default function MyPostsScreen() {
  const t = useTranslation();
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
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

    if (!rows) {
      setLoading(false);
      return;
    }

    const ids = rows.map((r) => r.id);
    const { data: counts } = ids.length
      ? await supabase.from("offers").select("request_id").in("request_id", ids)
      : { data: [] };

    const countMap: Record<string, number> = {};
    (counts ?? []).forEach((c: { request_id: string }) => {
      countMap[c.request_id] = (countMap[c.request_id] ?? 0) + 1;
    });

    setPosts(rows.map((r) => ({ ...r, offer_count: countMap[r.id] ?? 0 })));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoaded.current) {
        hasLoaded.current = true;
        fetchPosts();
      }
    }, [fetchPosts]),
  );

  async function handleMarkFilled(id: string) {
    Alert.alert(t("markFilled"), t("markFilledConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("confirm"),
        style: "default",
        onPress: async () => {
          await supabase
            .from("requests")
            .update({ status: "filled" })
            .eq("id", id);
          fetchPosts();
        },
      },
    ]);
  }

  async function handleDelete(id: string) {
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

  async function handleRepost(id: string) {
    const { data: job } = await supabase
      .from("requests")
      .select(
        "title,description,category,location,budget_min,budget_max,posting_as,job_type,schedule_type,availability_tags,screening_note,is_urgent,workers_needed",
      )
      .eq("id", id)
      .single();
    if (!job) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: newJob, error } = await supabase
      .from("requests")
      .insert({
        user_id: user.id,
        title: job.title,
        description: job.description,
        category: job.category,
        location: job.location,
        budget_min: job.budget_min,
        budget_max: job.budget_max,
        posting_as: job.posting_as,
        job_type: job.job_type,
        schedule_type: job.schedule_type,
        availability_tags: job.availability_tags,
        screening_note: job.screening_note,
        is_urgent: job.is_urgent,
        workers_needed: job.workers_needed,
        status: "active",
      })
      .select("id")
      .single();
    if (error) {
      Alert.alert(t("error"));
      return;
    }
    hasLoaded.current = false;
    fetchPosts();
    Alert.alert(t("repostDone"), t("repostDoneDesc"), [
      { text: t("view"), onPress: () => router.push(`/request/${newJob.id}`) },
      { text: t("ok") },
    ]);
  }

  async function handleSaveAsTemplate(id: string) {
    const { data: job } = await supabase
      .from("requests")
      .select(
        "title,description,category,location,budget_min,budget_max,posting_as,job_type,schedule_type,availability_tags,screening_note,is_urgent,workers_needed",
      )
      .eq("id", id)
      .single();
    if (!job) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("job_templates").insert({
      user_id: user.id,
      title: job.title,
      description: job.description,
      category: job.category,
      location: job.location,
      budget_min: job.budget_min,
      budget_max: job.budget_max,
      posting_as: job.posting_as,
      job_type: job.job_type,
      schedule_type: job.schedule_type,
      availability_tags: job.availability_tags,
      screening_note: job.screening_note,
      is_urgent: job.is_urgent,
      workers_needed: job.workers_needed,
    });
    if (error) {
      Alert.alert(t("error"));
      return;
    }
    Alert.alert(t("templateSavedTitle"), t("templateSavedDesc"));
  }

  async function handleBump(id: string) {
    Alert.alert(t("boostPost"), t("boostPostConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("boostPost"),
        onPress: async () => {
          const boostedUntil = new Date(
            Date.now() + 24 * 3600000,
          ).toISOString();
          await supabase
            .from("requests")
            .update({
              created_at: new Date().toISOString(),
              is_boosted: true,
              boosted_until: boostedUntil,
            })
            .eq("id", id);
          fetchPosts();
          Alert.alert(t("boostedBadge"));
        },
      },
    ]);
  }

  function renderItem({ item }: { item: JobPost }) {
    const isEmployer = item.posting_as === "employer";
    const statusColor = STATUS_COLOR[item.status] ?? theme.mutedText;
    const msLeft =
      new Date(item.created_at).getTime() + 30 * 86400000 - Date.now();
    const daysLeft = Math.ceil(msLeft / 86400000);
    const isBoostedActive =
      item.is_boosted &&
      (!item.boosted_until ||
        new Date(item.boosted_until).getTime() > Date.now());

    return (
      <Pressable
        style={[styles.card, isBoostedActive && styles.cardBoosted]}
        onPress={() => router.push(`/request/${item.id}`)}
      >
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={styles.cardTopLeft}>
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor: isEmployer
                      ? theme.employerLight
                      : theme.primaryLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeBadgeText,
                    { color: isEmployer ? theme.employer : theme.primary },
                  ]}
                >
                  {t(item.posting_as ?? "employer")}
                </Text>
              </View>
              {item.category ? (
                <Text style={styles.categoryText}>{item.category}</Text>
              ) : null}
            </View>
            <View style={styles.cardTopRight}>
              {item.is_urgent && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentBadgeText}>🔥 {t("isUrgent")}</Text>
                </View>
              )}
              {item.status === "active" && daysLeft > 0 && daysLeft <= 7 && (
                <View style={styles.expiryBadge}>
                  <Feather name="clock" size={10} color="#92400E" />
                  <Text style={styles.expiryBadgeText}>{daysLeft}d left</Text>
                </View>
              )}
              {item.status === "active" && daysLeft > 7 && (
                <View style={styles.expiryBadgeGreen}>
                  <Feather name="clock" size={10} color="#065F46" />
                  <Text style={styles.expiryBadgeTextGreen}>
                    {daysLeft}d left
                  </Text>
                </View>
              )}
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
            </View>
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.metaRow}>
            {item.location ? (
              <View style={styles.metaItem}>
                <Feather name="map-pin" size={12} color={theme.secondaryText} />
                <Text style={styles.metaText}>{item.location}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Feather name="users" size={12} color={theme.secondaryText} />
              <Text style={styles.metaText}>
                {item.offer_count} {t("applicants")}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {t(
                  `status${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`,
                )}
              </Text>
              {isBoostedActive && (
                <View style={styles.boostedIndicator}>
                  <Feather name="trending-up" size={10} color="#D97706" />
                  <Text style={styles.boostedIndicatorText}>
                    {t("boostedBadge")}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.actions}>
              {item.status === "active" && (
                <Pressable
                  style={[styles.actionBtn, styles.filledBtn]}
                  onPress={() => handleMarkFilled(item.id)}
                >
                  <Feather name="user-check" size={13} color={theme.primary} />
                </Pressable>
              )}
              {item.status === "active" && (
                <Pressable
                  style={[styles.actionBtn, styles.bumpBtn]}
                  onPress={() => handleBump(item.id)}
                >
                  <Feather name="trending-up" size={14} color="#7C3AED" />
                </Pressable>
              )}
              <Pressable
                style={styles.actionBtn}
                onPress={() =>
                  router.push({
                    pathname: "/request/[id]/offers",
                    params: { id: item.id },
                  })
                }
              >
                <Feather name="eye" size={16} color={theme.secondaryText} />
              </Pressable>
              <Pressable
                style={styles.actionBtn}
                onPress={() =>
                  router.push({
                    pathname: "/(modals)/create-request",
                    params: { id: item.id },
                  })
                }
              >
                <Feather name="edit-2" size={16} color={theme.secondaryText} />
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.repostBtn]}
                onPress={() => handleRepost(item.id)}
              >
                <Feather name="copy" size={15} color={theme.primary} />
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.templateBtn]}
                onPress={() => handleSaveAsTemplate(item.id)}
              >
                <Feather name="bookmark" size={15} color="#7C3AED" />
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => handleDelete(item.id)}
              >
                <Feather name="trash-2" size={16} color={theme.error} />
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("myPosts")}</Text>
        <Pressable
          style={styles.newBtn}
          onPress={() => router.push("/(modals)/create-request")}
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.newBtnText}>{t("newPost")}</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={theme.primary}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            posts.length === 0 && { flex: 1 },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={fetchPosts}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Feather name="file-text" size={32} color={theme.mutedText} />
              </View>
              <Text style={styles.emptyTitle}>{t("noPostsYet")}</Text>
              <Text style={styles.emptySubtitle}>{t("noPostsYetDesc")}</Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push("/(modals)/create-request")}
              >
                <Text style={styles.emptyBtnText}>{t("createYourFirst")}</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}
