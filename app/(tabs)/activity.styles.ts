import { StyleSheet } from "react-native";
import type { Colors } from "../../src/theme/colors";

export function makeStyles(c: Colors) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: c.bg },

    header: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 12,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderColor: c.border,
    },
    headerTitle: { fontSize: 20, fontWeight: "900", color: c.primaryText },

    // Main tab toggle (Posts / Applications)
    mainTabRow: {
      flexDirection: "row",
      // backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderColor: c.border,
    },
    mainTabBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 16,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    mainTabBtnActive: { borderBottomColor: c.primary },
    mainTabText: { fontSize: 15, fontWeight: "600", color: c.mutedText },
    mainTabTextActive: { fontWeight: "800", color: c.primary },
    mainTabBadge: {
      backgroundColor: c.primaryLight,
      borderRadius: 999,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    mainTabBadgeText: { fontSize: 10, fontWeight: "800", color: c.primary },

    // Sub-tab (Sent / Received)
    subTabRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 4,
      gap: 8,
    },
    subTabBtn: {
      paddingVertical: 5,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    subTabBtnActive: {
      backgroundColor: c.primaryLight,
      borderColor: c.primary,
    },
    subTabText: { fontSize: 12, fontWeight: "600", color: c.mutedText },
    subTabTextActive: { fontWeight: "800", color: c.primary },

    list: { padding: 12, gap: 10, paddingBottom: 40 },

    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardBoosted: { borderLeftWidth: 3, borderLeftColor: "#F59E0B" },
    cardTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 6,
    },
    cardTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "800",
      color: c.primaryText,
      lineHeight: 20,
    },
    cardSub: { fontSize: 12, color: c.secondaryText, marginBottom: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
    statusBadge: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 999,
    },
    statusBadgeText: { fontSize: 11, fontWeight: "700" },

    cardMeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 10,
      alignItems: "center",
    },
    chip: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      backgroundColor: c.surfaceAlt,
      borderRadius: 6,
    },
    chipText: { fontSize: 11, fontWeight: "600", color: c.secondaryText },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
    metaText: { fontSize: 11, color: c.mutedText },

    cardActions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 4,
      flexWrap: "wrap",
    },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    actionBtnDanger: { borderColor: "#FEE2E2", backgroundColor: "#FFF5F5" },
    actionBtnText: { fontSize: 12, fontWeight: "700", color: c.primary },

    coverLetterBox: {
      backgroundColor: "#F8FAFC",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      borderLeftWidth: 3,
      borderLeftColor: "#0D9488",
      padding: 10,
      marginBottom: 10,
    },
    coverLetterText: {
      fontSize: 13,
      color: "#64748B",
      lineHeight: 19,
    },
    coverLetterChevron: {
      alignSelf: "flex-end",
      marginTop: 4,
    },

    chatBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: c.primary,
    },
    chatBtnText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },

    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 12,
    },
    emptyText: { fontSize: 15, color: c.mutedText },
  });
}
