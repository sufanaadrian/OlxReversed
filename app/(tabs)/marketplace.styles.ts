import { StyleSheet } from "react-native";

export const theme = {
  primary: "#1E40AF",
  success: "#16A34A",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
  accentSoft: "#DBEAFE",
};

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },

  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBox: {
    flex: 1,
    height: 44,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, color: theme.primaryText, fontSize: 15 },
  iconBtn: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },

  chipsRow: { paddingTop: 12, paddingBottom: 2, gap: 8, paddingRight: 16 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipSelected: {
    backgroundColor: theme.accentSoft,
    borderColor: theme.primary,
  },
  chipText: { color: theme.secondaryText, fontSize: 13 },
  chipTextSelected: { color: theme.primaryText, fontWeight: "700" },

  swipeArea: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  emptyState: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: theme.primaryText },
  emptySubtitle: {
    fontSize: 14,
    color: theme.secondaryText,
    textAlign: "center",
  },
  refreshBtn: {
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bg,
  },
  refreshBtnText: { fontWeight: "900", color: theme.primaryText },

  cardWrap: { flex: 1 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  progressPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  progressPillText: {
    fontSize: 12,
    color: theme.secondaryText,
    fontWeight: "700",
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: theme.border,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: theme.primary },

  stack: { flex: 1, alignItems: "center", justifyContent: "center" },
  stackBg1: {
    position: "absolute",
    width: "96%",
    height: "86%",
    backgroundColor: theme.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    transform: [{ translateY: 14 }, { scale: 0.98 }],
  },
  stackBg2: {
    position: "absolute",
    width: "92%",
    height: "82%",
    backgroundColor: theme.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    transform: [{ translateY: 26 }, { scale: 0.96 }],
  },
  card: {
    width: "100%",
    height: "88%",
    backgroundColor: theme.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: "hidden",
  },

  // Photo thumbnails (inside scrollable card body)
  thumbRow: { gap: 8, paddingVertical: 4 },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: theme.border,
  },

  // Scrollable card body
  cardScroll: { flex: 1 },
  cardBody: { padding: 14, gap: 10 },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    backgroundColor: theme.accentSoft,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  badgeText: { fontSize: 12, color: theme.primaryText, fontWeight: "700" },
  badgeOutline: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bg,
  },
  badgeOutlineText: {
    fontSize: 11,
    color: theme.secondaryText,
    fontWeight: "700",
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.primaryText,
  },

  postedBy: {
    fontSize: 12,
    color: theme.secondaryText,
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 2,
  },

  desc: {
    fontSize: 14,
    color: theme.secondaryText,
    lineHeight: 20,
  },

  details: { gap: 8, paddingBottom: 8 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 14, color: theme.primaryText, flex: 1 },
  posted: { fontSize: 12, color: theme.secondaryText },

  indicatorLeft: {
    position: "absolute",
    top: 18,
    left: 18,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: theme.border,
  },
  indicatorRight: {
    position: "absolute",
    top: 18,
    right: 18,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: theme.accentSoft,
  },
  indicatorText: { fontSize: 12, fontWeight: "900", color: theme.primaryText },

  expandToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    marginTop: 2,
  },
  expandToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.secondaryText,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 10,
  },
  actionBtn: {
    height: 54,
    width: 54,
    borderRadius: 18,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
