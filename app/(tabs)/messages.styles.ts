import { StyleSheet } from "react-native";
import type { Colors } from "../../src/theme/colors";

export function makeStyles(c: Colors) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: c.bg },

    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerTitle: { fontSize: 22, fontWeight: "900", color: c.primaryText },
    headerCount: {
      fontSize: 13,
      fontWeight: "700",
      color: c.mutedText,
      backgroundColor: c.surfaceAlt,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },

    listContent: { paddingBottom: 24 },

    separator: { height: 1, backgroundColor: c.border, marginLeft: 84 },

    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 14,
    },
    rowUnread: {},

    avatarWrap: { position: "relative", flexShrink: 0 },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: c.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarBuyer: { backgroundColor: c.employerLight },
    avatarText: {
      fontSize: 17,
      fontWeight: "900",
      color: c.primary,
    },
    avatarTextBuyer: { color: c.employer },
    unreadDot: {
      position: "absolute",
      top: 0,
      right: 0,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: c.primary,
      borderWidth: 2,
      borderColor: c.surface,
    },

    rowContent: { flex: 1, gap: 3 },
    rowTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flex: 1,
    },
    username: {
      fontSize: 15,
      fontWeight: "800",
      color: c.primaryText,
      flexShrink: 1,
    },
    roleBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: c.primaryLight,
    },
    roleBadgeBuyer: { backgroundColor: c.employerLight },
    roleBadgeText: { fontSize: 10, fontWeight: "800", color: c.primary },
    roleBadgeTextBuyer: { color: c.employer },

    hiredBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: c.success,
    },
    hiredBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },

    time: { fontSize: 11, color: c.mutedText, flexShrink: 0 },

    jobRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    jobTitle: {
      fontSize: 12,
      color: c.mutedText,
      fontWeight: "600",
      flexShrink: 1,
    },
    lastMessage: { fontSize: 13, color: c.mutedText, lineHeight: 18 },
    lastMessageUnread: { color: c.primaryText, fontWeight: "600" },

    rowRight: { alignItems: "center", gap: 6, flexShrink: 0 },
    unreadBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
    },
    unreadBadgeText: { fontSize: 10, fontWeight: "900", color: "#FFFFFF" },
    chevron: { opacity: 0.3 },

    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 40,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: c.primaryText,
      textAlign: "center",
    },
    emptyDesc: {
      fontSize: 14,
      color: c.mutedText,
      textAlign: "center",
      lineHeight: 21,
    },
    emptyBtn: {
      marginTop: 4,
      paddingVertical: 12,
      paddingHorizontal: 28,
      backgroundColor: c.primary,
      borderRadius: 14,
    },
    emptyBtnText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },

    deleteAction: {
      backgroundColor: c.error,
      justifyContent: "center",
      alignItems: "center",
      width: 80,
      gap: 4,
    },
    deleteActionText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },

    swipeActions: { flexDirection: "row" },
    archiveAction: {
      backgroundColor: c.warning,
      justifyContent: "center",
      alignItems: "center",
      width: 80,
      gap: 4,
    },
    archiveActionText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },

    archivedToggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    archivedToggleText: { fontSize: 13, fontWeight: "600", color: c.mutedText },
  });
}
