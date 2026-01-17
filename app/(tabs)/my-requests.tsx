import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { Request } from "../../src/context/AppContext";
import { useApp } from "../../src/context/useApp";

export default function MyRequestsScreen() {
  const { myRequests } = useApp();

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.h1}>My Requests</Text>

        <Pressable
          onPress={() => router.push("/create-request")}
          style={({ pressed }) => [
            styles.createBtn,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Feather name="plus" size={20} color={theme.primaryText} />
        </Pressable>
      </View>

      {/* Content */}
      {myRequests.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Feather name="plus" size={22} color={theme.primary} />
          </View>
          <Text style={styles.emptyTitle}>No requests yet</Text>
          <Text style={styles.emptyText}>
            Create your first request to get started
          </Text>

          <Pressable
            onPress={() => router.push("/create-request")}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Create Request</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          data={myRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RequestRow request={item} />}
        />
      )}
    </View>
  );
}

function RequestRow({ request }: { request: Request }) {
  const statusStyle =
    request.status === "active" ? styles.badgeActive : styles.badgeMuted;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/request/[id]",
          params: { id: request.id },
        } as any)
      }
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {request.title}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {request.description}
          </Text>
        </View>

        <View style={[styles.badge, statusStyle]}>
          <Text style={styles.badgeText}>{request.status}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.category}>{request.category}</Text>
        <View style={styles.budget}>
          <Feather name="dollar-sign" size={16} color={theme.secondaryText} />
          <Text style={styles.metaText}>
            {request.budgetMin.toLocaleString()} -{" "}
            {request.budgetMax.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          {request.offersCount} {request.offersCount === 1 ? "offer" : "offers"}
        </Text>
        <Text style={styles.footerText}>
          Posted {new Date(request.datePosted).toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
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
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  header: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  h1: { fontSize: 20, fontWeight: "800", color: theme.primaryText },
  createBtn: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },

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
    backgroundColor: theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: theme.primaryText },
  emptyText: { marginTop: 6, color: theme.secondaryText, textAlign: "center" },
  primaryBtn: {
    marginTop: 14,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "white", fontWeight: "800" },

  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  cardTitle: { fontSize: 15, fontWeight: "800", color: theme.primaryText },
  cardDesc: { marginTop: 4, color: theme.secondaryText, lineHeight: 18 },

  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: theme.accentSoft,
    borderColor: theme.primary,
  },
  badgeMuted: { backgroundColor: theme.bg, borderColor: theme.border },
  badgeText: { fontSize: 12, fontWeight: "700", color: theme.primaryText },

  metaRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  category: { color: theme.secondaryText, fontWeight: "700", fontSize: 12 },
  budget: { flexDirection: "row", gap: 6, alignItems: "center" },
  metaText: { color: theme.primaryText, fontWeight: "700", fontSize: 12 },

  footerRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { color: theme.secondaryText, fontSize: 12 },
});
