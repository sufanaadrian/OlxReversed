import { Feather } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabsLayout() {
  const [open, setOpen] = useState(false);

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
              paddingTop: 8,
              paddingBottom: 10,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
          }}
        >
          <Tabs.Screen
            name="marketplace"
            options={{
              title: "Home",
              tabBarIcon: ({ color, size }) => (
                <Feather name="home" color={color} size={size} />
              ),
            }}
          />

          <Tabs.Screen
            name="my-requests"
            options={{
              title: "My Requests",
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
              title: "My Offers",
              tabBarIcon: ({ color, size }) => (
                <Feather name="briefcase" color={color} size={size} />
              ),
            }}
          />

          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
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
            <Text style={styles.sheetTitle}>What do you want to do?</Text>
            <Text style={styles.sheetSubtitle}>Choose your action below</Text>

            <Pressable style={styles.actionCard} onPress={goCreateRequest}>
              <View style={styles.actionIcon}>
                <Feather name="plus-circle" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Post a Request</Text>
                <Text style={styles.actionDesc}>
                  I want to buy or request a service
                </Text>
              </View>
            </Pressable>

            <Pressable style={styles.actionCard} onPress={goMarketplace}>
              <View style={styles.actionIcon}>
                <Feather name="search" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>View active requests</Text>
                <Text style={styles.actionDesc}>
                  I want to respond to existing requests
                </Text>
              </View>
            </Pressable>

            <Pressable style={styles.closeBtn} onPress={close}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          </View>
        </Modal>
      </>
    </SafeAreaView>
  );
}

const theme = {
  primary: "#1E40AF",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
  accentSoft: "#DBEAFE",
};

const styles = StyleSheet.create({
  // this reserves the middle “tab slot” width
  plusSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // the actual plus button
  plusBtn: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22, // lifts above the tab bar like OLX
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,23,0.35)",
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderColor: theme.border,
  },

  sheetTitle: { fontSize: 18, fontWeight: "800", color: theme.primaryText },
  sheetSubtitle: { marginTop: 4, color: theme.secondaryText },

  actionCard: {
    marginTop: 12,
    padding: 14, // keeps your padding
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    flexDirection: "row",
    gap: 12,
    backgroundColor: theme.surface,
  },
  actionIcon: {
    height: 40,
    width: 40,
    borderRadius: 14,
    backgroundColor: theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: 15, fontWeight: "800", color: theme.primaryText },
  actionDesc: { marginTop: 2, fontSize: 13, color: theme.secondaryText },

  closeBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { fontWeight: "700", color: theme.primaryText },
});
