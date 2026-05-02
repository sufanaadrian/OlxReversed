import { StyleSheet } from "react-native";
import type { Colors } from "../src/theme/colors";

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Hospitality: { bg: "#FEF3C7", text: "#92400E" },
  Retail: { bg: "#E0F2FE", text: "#0369A1" },
  Tutoring: { bg: "#EDE9FE", text: "#5B21B6" },
  Events: { bg: "#FCE7F3", text: "#9D174D" },
  Delivery: { bg: "#D1FAE5", text: "#065F46" },
  IT: { bg: "#DBEAFE", text: "#1D4ED8" },
  Office: { bg: "#F1F5F9", text: "#475569" },
  Marketing: { bg: "#FEE2E2", text: "#991B1B" },
  Other: { bg: "#F1F5F9", text: "#64748B" },
};

export const CATEGORY_COLORS_DARK: Record<
  string,
  { bg: string; text: string }
> = {
  Hospitality: { bg: "#451A03", text: "#FCD34D" },
  Retail: { bg: "#0C4A6E", text: "#7DD3FC" },
  Tutoring: { bg: "#2E1065", text: "#C4B5FD" },
  Events: { bg: "#500724", text: "#F9A8D4" },
  Delivery: { bg: "#064E3B", text: "#6EE7B7" },
  IT: { bg: "#1E3A5F", text: "#93C5FD" },
  Office: { bg: "#1E293B", text: "#94A3B8" },
  Marketing: { bg: "#450A0A", text: "#FCA5A5" },
  Other: { bg: "#1E293B", text: "#94A3B8" },
};

export function makeStyles(c: Colors) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: c.bg },

    navbar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      gap: 4,
    },
    navBack: { padding: 10, borderRadius: 10 },
    navTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: "800",
      color: c.primaryText,
      marginLeft: 4,
    },
    navCount: {
      fontSize: 13,
      fontWeight: "600",
      color: c.mutedText,
      marginRight: 8,
    },

    list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
    separator: { height: 12 },

    card: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    cardStrip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    cardStripText: { fontSize: 12, fontWeight: "700" },
    stripRight: { flexDirection: "row", alignItems: "center", gap: 6 },
    expiryBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: c.warningLight,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
    },
    expiryBadgeText: { fontSize: 11, fontWeight: "700", color: c.warning },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    roleBadgeText: { fontSize: 11, fontWeight: "700" },

    cardBody: { padding: 14 },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 4,
      gap: 8,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: c.primaryText,
      flex: 1,
    },
    unsaveBtn: { padding: 4 },
    cardDesc: {
      fontSize: 13,
      color: c.secondaryText,
      lineHeight: 18,
      marginBottom: 8,
    },

    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 6,
    },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: c.surfaceAlt,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    metaChipText: {
      fontSize: 12,
      color: c.secondaryText,
      fontWeight: "500",
    },

    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      gap: 12,
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: c.primaryText,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 14,
      color: c.mutedText,
      textAlign: "center",
      lineHeight: 20,
    },
    browseBtn: {
      marginTop: 8,
      paddingVertical: 12,
      paddingHorizontal: 28,
      backgroundColor: c.primary,
      borderRadius: 14,
    },
    browseBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  });
}
