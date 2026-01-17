import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../src/components/Screen";
import type { Offer } from "../../src/context/AppContext";
import { useApp } from "../../src/context/useApp";

type Tab = "accepted" | "rejected";

export default function MyOffersScreen() {
  const { offers } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("accepted");

  const acceptedOffers = useMemo(
    () => offers.filter((o) => o.status === "accepted"),
    [offers],
  );
  const rejectedOffers = useMemo(
    () => offers.filter((o) => o.status === "rejected"),
    [offers],
  );

  const displayOffers =
    activeTab === "accepted" ? acceptedOffers : rejectedOffers;

  return (
    <Screen>
      <View style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.h1}>My Offers</Text>

          <View style={styles.tabs}>
            <Pressable
              onPress={() => setActiveTab("accepted")}
              style={[
                styles.tabBtn,
                activeTab === "accepted" && styles.tabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "accepted" && styles.tabTextActive,
                ]}
              >
                Accepted ({acceptedOffers.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("rejected")}
              style={[
                styles.tabBtn,
                activeTab === "rejected" && styles.tabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "rejected" && styles.tabTextActive,
                ]}
              >
                Rejected ({rejectedOffers.length})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Content */}
        {displayOffers.length === 0 ? (
          <View style={styles.empty}>
            <View
              style={[
                styles.emptyIcon,
                activeTab === "accepted"
                  ? styles.emptyIconSuccess
                  : styles.emptyIconDestructive,
              ]}
            >
              <Feather
                name={activeTab === "accepted" ? "check-circle" : "x-circle"}
                size={22}
                color={
                  activeTab === "accepted" ? theme.success : theme.destructive
                }
              />
            </View>
            <Text style={styles.emptyTitle}>No {activeTab} offers</Text>
            <Text style={styles.emptyText}>
              {activeTab === "accepted"
                ? "Accepted offers will appear here"
                : "Rejected offers will appear here for your reference"}
            </Text>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            data={displayOffers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <OfferCard offer={item} activeTab={activeTab} />
            )}
          />
        )}
      </View>
    </Screen>
  );
}

function OfferCard({ offer, activeTab }: { offer: Offer; activeTab: Tab }) {
  const statusIsAccepted = offer.status === "accepted";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {offer.sellerName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.sellerName}>{offer.sellerName}</Text>
          <View style={styles.ratingRow}>
            <Feather name="star" size={14} color={theme.secondaryText} />
            <Text style={styles.ratingText}>{offer.rating}</Text>
          </View>
        </View>

        <View
          style={[
            styles.badge,
            statusIsAccepted ? styles.badgeSuccess : styles.badgeDestructive,
          ]}
        >
          <Text style={styles.badgeText}>{offer.status}</Text>
        </View>
      </View>

      <Text style={styles.price}>${offer.price.toLocaleString()}</Text>
      <Text style={styles.desc}>{offer.description}</Text>

      {activeTab === "accepted" && (
        <View style={styles.actions}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() =>
              router.push({ pathname: "/chat/[id]", params: { id: offer.id } })
            }
          >
            <Feather name="message-square" size={18} color="white" />
            <Text style={styles.primaryBtnText}>Chat</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Proceed</Text>
          </Pressable>
        </View>
      )}
    </View>
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
  header: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 10 },
  h1: { fontSize: 20, fontWeight: "800", color: theme.primaryText },

  tabs: { flexDirection: "row", gap: 8, marginTop: 12 },
  tabBtn: {
    flex: 1,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surface,
  },
  tabBtnActive: {
    borderColor: theme.primary,
    backgroundColor: theme.accentSoft,
  },
  tabText: { fontSize: 12, fontWeight: "700", color: theme.secondaryText },
  tabTextActive: { color: theme.primaryText },

  empty: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    height: 52,
    width: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyIconSuccess: { backgroundColor: "#DCFCE7", borderColor: "#BBF7D0" },
  emptyIconDestructive: { backgroundColor: "#FEE2E2", borderColor: "#FECACA" },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: theme.primaryText },
  emptyText: { marginTop: 6, color: theme.secondaryText, textAlign: "center" },

  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", gap: 12, alignItems: "center" },
  avatar: {
    height: 42,
    width: 42,
    borderRadius: 14,
    backgroundColor: theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  avatarText: { fontWeight: "900", color: theme.primaryText },
  sellerName: { fontSize: 15, fontWeight: "800", color: theme.primaryText },
  ratingRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginTop: 2,
  },
  ratingText: { color: theme.secondaryText, fontWeight: "700" },

  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeSuccess: { backgroundColor: "#DCFCE7", borderColor: "#BBF7D0" },
  badgeDestructive: { backgroundColor: "#FEE2E2", borderColor: "#FECACA" },
  badgeText: { fontSize: 12, fontWeight: "800", color: theme.primaryText },

  price: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "900",
    color: theme.primaryText,
  },
  desc: { marginTop: 8, color: theme.secondaryText, lineHeight: 18 },

  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  primaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: { color: "white", fontWeight: "900" },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { fontWeight: "900", color: theme.primaryText },
});
