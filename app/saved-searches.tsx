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
import { useTranslation } from "../src/context/LanguageContext";
import { supabase } from "../src/lib/supabase";
import { styles, theme } from "./saved-searches.styles";

type JobAlert = {
  id: string;
  category: string | null;
  keyword: string | null;
  location: string | null;
  created_at: string;
};

export default function SavedSearchesScreen() {
  const t = useTranslation();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("job_alerts")
      .select("id, category, keyword, location, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setAlerts((data as JobAlert[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAlerts();
    }, [fetchAlerts]),
  );

  async function handleDelete(alertId: string) {
    Alert.alert(t("deleteAlert"), undefined, [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          await supabase.from("job_alerts").delete().eq("id", alertId);
          setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        },
      },
    ]);
  }

  function applyAlert(alert: JobAlert) {
    // Navigate to marketplace with the saved search pre-applied
    // Pass via router params — marketplace reads them on focus
    router.push({
      pathname: "/(tabs)/marketplace",
      params: {
        q: alert.keyword ?? "",
        cat: alert.category ?? "All",
      },
    } as any);
  }

  function renderItem({ item }: { item: JobAlert }) {
    const tags: { label: string; value: string }[] = [];
    if (item.keyword)
      tags.push({ label: t("alertKeyword"), value: item.keyword });
    if (item.category)
      tags.push({ label: t("alertCategory"), value: item.category });
    if (item.location)
      tags.push({ label: t("alertLocation"), value: item.location });

    const title =
      [item.keyword, item.category, item.location]
        .filter(Boolean)
        .join(" · ") || t("any");

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
        onPress={() => applyAlert(item)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          <Pressable
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="trash-2" size={16} color={theme.error} />
          </Pressable>
        </View>

        <View style={styles.tagRow}>
          {tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagLabel}>{tag.label}:</Text>
              <Text style={styles.tagValue}>{tag.value}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.page} edges={["top"]}>
      <View style={styles.navbar}>
        <Pressable style={styles.navBack} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={theme.primaryText} />
        </Pressable>
        <Text style={styles.navTitle}>{t("savedSearches")}</Text>
        {!loading && <Text style={styles.navCount}>{alerts.length}</Text>}
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={theme.primary}
        />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(a) => a.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            alerts.length === 0 && { flex: 1 },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={fetchAlerts}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Feather name="bell" size={32} color={theme.primaryDark} />
              </View>
              <Text style={styles.emptyTitle}>{t("noSavedSearches")}</Text>
              <Text style={styles.emptySubtitle}>
                {t("noSavedSearchesHint")}
              </Text>
              <Pressable style={styles.browseBtn} onPress={() => router.back()}>
                <Text style={styles.browseBtnText}>{t("findJobs")}</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
