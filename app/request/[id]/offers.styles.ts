import { StyleSheet } from "react-native";

export const theme = {
  primary: "#1E40AF",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
  accentSoft: "#DBEAFE",
  success: "#16A34A",
  danger: "#DC2626",
};

export const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  backBtn: {
    height: 40,
    width: 40,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: theme.primaryText },
  headerSub: { fontSize: 12, color: theme.secondaryText },

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
  filterText: { fontWeight: "800", color: theme.secondaryText, fontSize: 12 },
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
  },
  titleEmpty: { fontSize: 16, fontWeight: "900", color: theme.primaryText },
  muted: { color: theme.secondaryText, textAlign: "center" },

  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seller: { fontSize: 13, fontWeight: "900", color: theme.primaryText },

  statusPill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  pillPending: { backgroundColor: theme.accentSoft },
  pillAccepted: { backgroundColor: "#DCFCE7" },
  pillRejected: { backgroundColor: "#FEE2E2" },
  pillWithdrawn: { backgroundColor: "#E5E7EB" },
  statusText: { fontSize: 12, fontWeight: "900", color: theme.primaryText },

  price: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "900",
    color: theme.primaryText,
  },
  desc: { marginTop: 6, color: theme.secondaryText, lineHeight: 18 },

  slotsBox: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  slotChip: {
    backgroundColor: theme.accentSoft,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  slotChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.primary,
  },

  counterBox: {
    marginTop: 10,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 10,
    gap: 4,
  },
  counterTitle: { fontWeight: "900", color: theme.primaryText },
  counterMsg: { color: theme.secondaryText },
  counterStatus: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.secondaryText,
  },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: theme.primary },
  btnPrimaryText: { color: "white", fontWeight: "900" },
  btnSecondary: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  btnSecondaryText: { color: theme.primaryText, fontWeight: "900" },

  warnBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  warnText: {
    flex: 1,
    color: theme.danger,
    fontWeight: "800",
    fontSize: 12,
  },
});
