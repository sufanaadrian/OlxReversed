import { StyleSheet } from "react-native";

export const theme = {
  primary: "#0D9488",
  primaryLight: "#CCFBF1",
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5F9",
  primaryText: "#0F172A",
  secondaryText: "#64748B",
  mutedText: "#94A3B8",
  border: "#E2E8F0",
};

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.surface },

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: theme.primaryText },

  separator: { height: 1, backgroundColor: theme.border, marginLeft: 76 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.surface,
    gap: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.primary,
  },

  rowContent: { flex: 1, gap: 2 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  username: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.primaryText,
    flex: 1,
  },
  time: { fontSize: 11, color: theme.mutedText, marginLeft: 8 },
  jobTitle: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: "600",
  },
  lastMessage: { fontSize: 13, color: theme.mutedText },
  lastMessageUnread: { color: theme.primaryText, fontWeight: "600" },

  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  unreadBadgeText: { fontSize: 10, fontWeight: "900", color: "#FFFFFF" },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: theme.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.primaryText,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 14,
    color: theme.mutedText,
    textAlign: "center",
    lineHeight: 20,
  },
});
