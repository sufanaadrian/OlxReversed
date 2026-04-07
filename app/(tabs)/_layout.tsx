import { Feather } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage, useTranslation } from "../../src/context/LanguageContext";
import { styles, theme } from "./_layout.styles";

export default function TabsLayout() {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const t = useTranslation();

  const close = () => setOpen(false);

  const goCreateRequest = () => {
    close();
    router.push("/create-request");
  };

  const goMarketplace = () => {
    close();
    router.push("/marketplace");
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
                <Feather name="home" color={color} size={size} />
              ),
            }}
          />

          <Tabs.Screen
            name="my-requests"
            options={{
              title: t("myRequests"),
              tabBarIcon: ({ color, size }) => (
                <Feather name="file-text" color={color} size={size} />
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
            name="my-offers"
            options={{
              title: t("myOffers"),
              tabBarIcon: ({ color, size }) => (
                <Feather name="briefcase" color={color} size={size} />
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
