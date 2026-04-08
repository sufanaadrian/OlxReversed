import { StyleSheet } from "react-native";

export const theme = {
  primary: "#1E40AF",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
  accentSoft: "#DBEAFE",
  dangerSoft: "#FEE2E2",
  successSoft: "#DCFCE7",
};

export const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: { marginBottom: 10 },
  h1: { fontSize: 22, fontWeight: "900", color: theme.primaryText },

  filtersWrap: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 6,
    marginBottom: 6,
    overflow: "hidden",
  },
  filters: {
    flexDirection: "row",
    gap: 6,
    paddingRight: 20,
  },
  scrollHint: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
  },

  scrollHintArrow: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.secondaryText,
  },

  filterBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 },
  filterBtnActive: { backgroundColor: theme.accentSoft },
  filterText: { fontWeight: "900", color: theme.secondaryText, fontSize: 12 },
  filterTextActive: { color: theme.primaryText },

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
    marginTop: 12,
  },
  centerTitle: { fontSize: 16, fontWeight: "900", color: theme.primaryText },
  centerSub: { color: theme.secondaryText, textAlign: "center" },

  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  category: { color: theme.secondaryText, fontWeight: "900", fontSize: 12 },
  title: {
    color: theme.primaryText,
    fontWeight: "900",
    fontSize: 16,
    marginTop: 2,
  },
  by: {
    color: theme.secondaryText,
    fontWeight: "700",
    fontSize: 12,
    marginTop: 4,
  },
  desc: { marginTop: 10, color: theme.secondaryText, lineHeight: 18 },

  metaRow: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bg,
  },
  pillInterested: {
    backgroundColor: theme.accentSoft,
    borderColor: theme.primary,
  },
  pillSkipped: { backgroundColor: theme.border, borderColor: theme.border },
  pillText: { fontSize: 12, fontWeight: "900", color: theme.primaryText },

  myOfferBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  myOfferTitle: { fontWeight: "900", color: theme.primaryText },
  myOfferDesc: { marginTop: 4, color: theme.secondaryText, fontWeight: "700" },
  myOfferMeta: {
    marginTop: 6,
    color: theme.secondaryText,
    fontWeight: "700",
    fontSize: 12,
  },

  counterBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bg,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  counterTitle: { fontWeight: "900", color: theme.primaryText },
  counterStatus: {
    fontWeight: "900",
    color: theme.secondaryText,
    fontSize: 12,
  },

  statusRow: { marginTop: 12 },
  statusPill: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 14 },
  statusNone: { backgroundColor: theme.border },
  statusPending: { backgroundColor: theme.accentSoft },
  statusAccepted: { backgroundColor: theme.successSoft },
  statusRejected: { backgroundColor: theme.dangerSoft },
  statusWithdrawn: { backgroundColor: theme.dangerSoft },

  statusText: { fontWeight: "900", fontSize: 12, color: theme.primaryText },

  actionRow: { marginTop: 12, gap: 10 },
  btnPrimary: {
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  btnPrimaryText: { color: "white", fontWeight: "900" },

  btnSecondary: {
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  btnSecondaryText: { color: theme.primaryText, fontWeight: "900" },

  skippedHint: {
    color: theme.secondaryText,
    fontWeight: "700",
    textAlign: "center",
  },

  rightActionsWrap: {
    width: 120,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
    paddingRight: 6,
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
  withdrawBtn: {
    width: 50,
    height: "100%",
    borderRadius: 18,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 10,
  },
  actionText: { color: "white", fontWeight: "900", fontSize: 12 },

  threadHeader: { marginTop: 10 },
  threadToggle: { paddingVertical: 6 },
  threadToggleText: { fontWeight: "900", color: theme.primaryText },

  threadWrap: { marginTop: 10, gap: 10 },
  threadTitle: { fontWeight: "900", color: theme.primaryText },

  threadNode: {
    borderLeftWidth: 3,
    borderLeftColor: theme.border,
    paddingLeft: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.bg,
  },

  offerRow: { gap: 2 },
  offerMain: { fontWeight: "900", color: theme.primaryText },
  offerMeta: { fontSize: 12, color: theme.secondaryText, fontWeight: "700" },
  offerDesc: {
    marginTop: 6,
    marginBottom: 6,
    color: theme.secondaryText,
    lineHeight: 18,
  },

  counterNode: {
    marginTop: 10,
    marginLeft: 6,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    gap: 4,
  },

  threadNodeLatest: {
    borderLeftColor: theme.primary,
    backgroundColor: "#f0f9ff",
  },

  currentBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 4,
  },

  currentBadgeText: {
    color: "white",
    fontWeight: "900",
    fontSize: 10,
  },
  offerHeaderRow: { gap: 6 },
  offerCompareRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  offerMainGood: { color: "#16a34a" },
  offerMainBad: { color: "#dc2626" },

  oldOfferText: {
    fontWeight: "900",
    color: "#dc2626",
    textDecorationLine: "line-through",
  },
  arrowText: { fontWeight: "900", color: theme.secondaryText },
  newOfferText: { fontWeight: "900", color: "#16a34a" },

  counterMain: { fontWeight: "600", color: theme.secondaryText },
  counterEmail: { fontWeight: "800", color: theme.primaryText, fontSize: 13 },
  counterPrice: { fontWeight: "900", color: theme.primaryText, fontSize: 14 },
  counterMsg: { color: theme.secondaryText, lineHeight: 18 },
  counterMeta: { fontSize: 12, color: theme.secondaryText, fontWeight: "700" },
  counterActions: { flexDirection: "row", gap: 10, marginTop: 8 },

  detailLocation: {
    marginTop: 8,
    color: theme.secondaryText,
    fontWeight: "700",
    fontSize: 13,
  },

  detailActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  detailActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#111827",
  },

  detailActionBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },

  detailActionBtnSecondary: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },

  detailActionBtnSecondaryText: {
    color: theme.primaryText,
  },
});
