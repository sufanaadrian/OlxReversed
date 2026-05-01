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
import { styles, theme } from "./my-requests.styles";

type JobPost = {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  status: string;
  posting_as: string | null;
  created_at: string;
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
      .select("id, title, category, location, status, posting_as, created_at")
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
      fetchPosts();
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

  function renderItem({ item }: { item: JobPost }) {
    const isEmployer = item.posting_as === "employer";
    const statusColor = STATUS_COLOR[item.status] ?? theme.mutedText;

    return (
      <Pressable
        style={styles.card}
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
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
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
            <Text style={[styles.statusText, { color: statusColor }]}>
              {t(
                `status${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`,
              )}
            </Text>
            <View style={styles.actions}>
              {item.status === "active" && (
                <Pressable
                  style={[styles.actionBtn, styles.filledBtn]}
                  onPress={() => handleMarkFilled(item.id)}
                >
                  <Feather name="user-check" size={13} color={theme.primary} />
                  <Text style={styles.filledBtnText}>{t("markFilled")}</Text>
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
