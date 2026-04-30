import { StyleSheet } from "react-native";

export const theme = {
  primary: "#1E40AF",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
  accentSoft: "#DBEAFE",
};

export const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: theme.bg,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  header: { fontSize: 20, fontWeight: "900", color: theme.primaryText },

  createBtn: {
    height: 40,
    width: 40,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  filtersWrap: { alignItems: "center", marginBottom: 6 },
  filters: {
    flexDirection: "row",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 6,
    gap: 6,
  },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 },
  filterBtnActive: { backgroundColor: theme.accentSoft },
  filterText: { fontWeight: "800", color: theme.secondaryText, fontSize: 12 },
  filterTextActive: { color: theme.primaryText },

  listContent: { paddingBottom: 18 },

  centerCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  titleEmpty: { fontSize: 16, fontWeight: "900", color: theme.primaryText },
  muted: { color: theme.secondaryText, textAlign: "center" },

  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 12,
    marginTop: 12,
    gap: 10,
  },
  cardInner: {
    flexDirection: "row",
    gap: 12,
  },
  cardThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: theme.border,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rightBadges: { flexDirection: "row", gap: 8, alignItems: "center" },

  categoryPill: {
    alignSelf: "flex-start",
    backgroundColor: theme.accentSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontWeight: "900",
    color: theme.primaryText,
  },

  offerPill: {
    backgroundColor: theme.accentSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  offerPillText: { fontSize: 12, fontWeight: "900", color: theme.primary },

  // ✅ NEW withdrawn badge styles
  withdrawnPill: {
    backgroundColor: theme.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  withdrawnPillText: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.primaryText,
  },

  dealPill: {
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dealPillText: { fontSize: 12, fontWeight: "900", color: "#166534" },

  statusPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statusActive: {
    backgroundColor: theme.accentSoft,
    borderColor: theme.primary,
  },
  statusMatched: { backgroundColor: "#FEF9C3", borderColor: "#F59E0B" },
  statusClosed: { backgroundColor: theme.border, borderColor: theme.border },
  statusText: { fontSize: 12, fontWeight: "900", color: theme.primaryText },
  statusOpen: {
    backgroundColor: "#2f855a",
  },
  statusNegotiating: {
    backgroundColor: "#805ad5",
  },

  title: {
    fontSize: 15,
    fontWeight: "900",
    color: theme.primaryText,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    alignItems: "center",
  },
  metaStrong: { fontWeight: "900", color: theme.primaryText },
  metaMuted: { color: theme.secondaryText },
  availWrap: {
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 10,
  },
  smallMuted: { fontSize: 12, color: theme.secondaryText },

  reviewBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewBtnText: { color: "white", fontWeight: "900", fontSize: 12 },

  viewBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  viewBtnText: { color: theme.primaryText, fontWeight: "900", fontSize: 12 },

  rightActionsWrap: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginTop: 12,
    gap: 4,
    width: 120,
  },
  deleteBtn: {
    width: 50,
    height: "100%",
    borderRadius: 18,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  editBtn: {
    width: 50,
    height: "100%",
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 10,
  },
  deleteText: { color: "white", fontWeight: "900", fontSize: 12 },

  topLeft: { flexDirection: "row", gap: 6, alignItems: "center" },

  offeringTag: {
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  offeringTagText: { fontSize: 11, fontWeight: "900", color: "#166534" },
  seekingTag: {
    backgroundColor: "#DBEAFE",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seekingTagText: { fontSize: 11, fontWeight: "900", color: "#1e40af" },
});
