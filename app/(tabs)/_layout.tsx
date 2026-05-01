import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Tabs, router } from "expo-router";
import React, { useCallback, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage, useTranslation } from "../../src/context/LanguageContext";
import { requireAuth } from "../../src/lib/authGuard";
import { supabase } from "../../src/lib/supabase";
import { styles, theme } from "./_layout.styles";

export default function TabsLayout() {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const t = useTranslation();
  const [pendingApplicants, setPendingApplicants] = useState(0);
  const [newResponses, setNewResponses] = useState(0);

  const fetchBadges = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Badge for "Activity": count pending offers on my posts (new applicants)
    const { data: myPosts } = await supabase
      .from("requests")
      .select("id")
      .eq("user_id", user.id);

    const myPostIds = (myPosts ?? []).map((p) => p.id);

    if (myPostIds.length > 0) {
      const { count } = await supabase
        .from("offers")
        .select("id", { count: "exact", head: true })
        .in("request_id", myPostIds)
        .eq("status", "pending");
      setPendingApplicants(count ?? 0);
    } else {
      setPendingApplicants(0);
    }

    // Badge for "Messages": count unread messages across all my conversations
    // Conversations = requests where I have an accepted offer (as applicant)
    //               + my posts that have accepted offers (as employer)
    const { data: myAcceptedOffers } = await supabase
      .from("offers")
      .select("request_id")
      .eq("seller_id", user.id)
      .eq("status", "accepted");

    const acceptedOnMyPosts =
      myPostIds.length > 0
        ? await supabase
            .from("offers")
            .select("request_id")
            .in("request_id", myPostIds)
            .eq("status", "accepted")
        : { data: [] };

    const convoIds = [
      ...(myAcceptedOffers ?? []).map((o) => o.request_id),
      ...(acceptedOnMyPosts.data ?? []).map((o) => o.request_id),
    ];
    const uniqueConvoIds = [...new Set(convoIds)];

    if (uniqueConvoIds.length > 0) {
      const { count: unread } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("request_id", uniqueConvoIds)
        .neq("sender_id", user.id)
        .is("read_at", null);
      setNewResponses(unread ?? 0);
    } else {
      setNewResponses(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBadges();
    }, [fetchBadges]),
  );

  const close = () => setOpen(false);

  const goCreateRequest = async () => {
    close();
    const guard = await requireAuth("/create-request");
    if (!guard.ok) return;
    router.push("/create-request");
  };

  const goMarketplace = () => {
    close();
    router.push("/(tabs)/marketplace" as any);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      edges={["top"]}
    >
      <>
        <Tabs
          key={language}
          initialRouteName="marketplace"
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: true,
            tabBarActiveTintColor: theme.primary,
            tabBarInactiveTintColor: theme.secondaryText,
            tabBarStyle: {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
              height: 66,
              paddingTop: 4,
              paddingBottom: 10,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
          }}
        >
          <Tabs.Screen
            name="marketplace"
            options={{
              title: t("home"),
              tabBarIcon: ({ color, size }) => (
                <Feather name="search" color={color} size={size} />
              ),
            }}
          />

          <Tabs.Screen
            name="activity"
            options={{
              title: t("activity"),
              tabBarBadge:
                pendingApplicants > 0 ? pendingApplicants : undefined,
              tabBarBadgeStyle: {
                backgroundColor: theme.primary,
                fontSize: 10,
              },
              tabBarIcon: ({ color, size }) => (
                <Feather name="layers" color={color} size={size} />
              ),
            }}
          />

          {/* MIDDLE SLOT (+) — counts as a real tab */}
          <Tabs.Screen
            name="__plus__"
            options={{
              title: "",
              tabBarLabel: "",
              tabBarButton: () => (
                <Pressable
                  onPress={() => setOpen(true)}
                  style={({ pressed }) => [
                    styles.plusSlot,
                    pressed && { transform: [{ scale: 0.96 }] },
                  ]}
                >
                  <View style={styles.plusBtn}>
                    <Feather name="plus" size={28} color="#FFFFFF" />
                  </View>
                </Pressable>
              ),
            }}
            listeners={{
              tabPress: (e) => {
                // don’t navigate to the "__plus__" screen
                e.preventDefault();
                setOpen(true);
              },
            }}
          />

          <Tabs.Screen
            name="messages"
            options={{
              title: t("messages"),
              tabBarBadge: newResponses > 0 ? newResponses : undefined,
              tabBarBadgeStyle: {
                backgroundColor: theme.primary,
                fontSize: 10,
              },
              tabBarIcon: ({ color, size }) => (
                <Feather name="message-circle" color={color} size={size} />
              ),
            }}
          />

          <Tabs.Screen
            name="profile"
            options={{
              title: t("profile"),
              tabBarIcon: ({ color, size }) => (
                <Feather name="user" color={color} size={size} />
              ),
            }}
          />

          {/* Hide legacy screens from tab bar */}
          <Tabs.Screen name="my-requests" options={{ href: null }} />
          <Tabs.Screen name="my-offers" options={{ href: null }} />
        </Tabs>

        {/* Action Menu Modal */}
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={close}
        >
          <Pressable style={styles.backdrop} onPress={close} />

          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t("createRequest")}</Text>
            <Text style={styles.sheetSubtitle}>{t("chooseYourAction")}</Text>

            <Pressable style={styles.actionCard} onPress={goCreateRequest}>
              <View style={styles.actionIcon}>
                <Feather name="plus-circle" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>{t("postARequest")}</Text>
                <Text style={styles.actionDesc}>
                  {t("iWantToBuyOrRequest")}
                </Text>
              </View>
            </Pressable>

            <Pressable style={styles.actionCard} onPress={goMarketplace}>
              <View style={styles.actionIcon}>
                <Feather name="search" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>
                  {t("viewActiveRequests")}
                </Text>
                <Text style={styles.actionDesc}>{t("iWantToRespond")}</Text>
              </View>
            </Pressable>

            <Pressable style={styles.closeBtn} onPress={close}>
              <Text style={styles.closeBtnText}>{t("close")}</Text>
            </Pressable>
          </View>
        </Modal>
      </>
    </SafeAreaView>
  );
}
