import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../src/components/Screen";
import { useApp } from "../../src/context/useApp";

export default function ProfileScreen() {
  const { myRequests, offers } = useApp();
  const [showLogout, setShowLogout] = useState(false);

  const acceptedOffersCount = useMemo(
    () => offers.filter((o) => o.status === "accepted").length,
    [offers],
  );

  const settingsGroups = [
    {
      title: "Account",
      items: [
        { icon: "user", label: "Edit Profile", value: "" },
        { icon: "mail", label: "Email", value: "user@example.com" },
        { icon: "map-pin", label: "Location", value: "San Francisco, CA" },
      ] as const,
    },
    {
      title: "Preferences",
      items: [
        { icon: "bell", label: "Notifications", value: "" },
        { icon: "lock", label: "Privacy", value: "" },
      ] as const,
    },
  ];

  return (
    <Screen>
      <View style={styles.page}>
        {/* Header + Profile */}
        <View style={styles.header}>
          <Text style={styles.h1}>Profile</Text>

          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>U</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>User Name</Text>
              <Text style={styles.email}>user@example.com</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Feather name="file-text" size={18} color={theme.secondaryText} />
              <Text style={styles.statLabel}>Requests</Text>
              <Text style={styles.statValue}>{myRequests.length}</Text>
            </View>

            <View style={styles.statCard}>
              <Feather name="briefcase" size={18} color={theme.success} />
              <Text style={styles.statLabel}>Deals</Text>
              <Text style={styles.statValue}>{acceptedOffersCount}</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.settings}>
          {settingsGroups.map((group) => (
            <View key={group.title} style={{ marginBottom: 16 }}>
              <Text style={styles.groupTitle}>{group.title}</Text>

              <View style={styles.groupBox}>
                {group.items.map((item, idx) => (
                  <Pressable
                    key={`${item.label}-${idx}`}
                    style={({ pressed }) => [
                      styles.item,
                      pressed && { opacity: 0.96 },
                    ]}
                    onPress={() => {}}
                  >
                    <Feather
                      name={item.icon as any}
                      size={18}
                      color={theme.secondaryText}
                    />
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <View style={{ flex: 1 }} />
                    {item.value ? (
                      <Text style={styles.itemValue}>{item.value}</Text>
                    ) : (
                      <Feather
                        name="chevron-right"
                        size={18}
                        color={theme.secondaryText}
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {/* Logout */}
          <View style={styles.groupBox}>
            <Pressable
              style={({ pressed }) => [
                styles.item,
                pressed && { opacity: 0.96 },
              ]}
              onPress={() => setShowLogout(true)}
            >
              <Feather name="log-out" size={18} color={theme.destructive} />
              <Text style={[styles.itemLabel, { color: theme.destructive }]}>
                Log Out
              </Text>
              <View style={{ flex: 1 }} />
            </Pressable>
          </View>

          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        {/* Logout Modal */}
        <Modal
          transparent
          visible={showLogout}
          animationType="fade"
          onRequestClose={() => setShowLogout(false)}
        >
          <Pressable
            style={styles.backdrop}
            onPress={() => setShowLogout(false)}
          >
            <View />
          </Pressable>

          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Out</Text>
            <Text style={styles.modalText}>
              Are you sure you want to log out?
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalBtn}
                onPress={() => setShowLogout(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnDanger]}
                onPress={() => setShowLogout(false)}
              >
                <Text style={[styles.modalBtnText, { color: "white" }]}>
                  Log Out
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
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
  success: "#16A34A",
  destructive: "#DC2626",
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  header: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 12 },
  h1: { fontSize: 20, fontWeight: "800", color: theme.primaryText },

  profileRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 14,
  },
  avatar: {
    height: 46,
    width: 46,
    borderRadius: 16,
    backgroundColor: theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  avatarText: { fontWeight: "900", color: theme.primaryText, fontSize: 18 },
  name: { fontSize: 16, fontWeight: "900", color: theme.primaryText },
  email: { marginTop: 2, color: theme.secondaryText },

  statsRow: { marginTop: 12, flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  statLabel: { color: theme.secondaryText, fontWeight: "700" },
  statValue: { fontSize: 18, fontWeight: "900", color: theme.primaryText },

  settings: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 18 },
  groupTitle: { marginBottom: 8, fontWeight: "900", color: theme.primaryText },
  groupBox: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  itemLabel: { fontWeight: "800", color: theme.primaryText },
  itemValue: { color: theme.secondaryText, fontWeight: "700" },

  version: { marginTop: 12, color: theme.secondaryText, textAlign: "center" },

  backdrop: { flex: 1, backgroundColor: "rgba(2, 6, 23, 0.35)" },
  modalCard: {
    position: "absolute",
    left: 16,
    right: 16,
    top: "40%",
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: theme.primaryText },
  modalText: { marginTop: 8, color: theme.secondaryText, lineHeight: 18 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnDanger: {
    backgroundColor: theme.destructive,
    borderColor: theme.destructive,
  },
  modalBtnText: { fontWeight: "900", color: theme.primaryText },
});
