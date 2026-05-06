import { StyleSheet } from "react-native";
import type { Colors } from "../../../src/theme/colors";

export function makeStyles(c: Colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
  },

  page: {
    flex: 1,
    backgroundColor: c.bg,
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
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: c.primaryText },
  headerSub: { fontSize: 12, color: c.secondaryText },

  filtersWrap: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
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
    color: c.secondaryText,
  },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 },
  filterBtnActive: { backgroundColor: c.accentSoft },
  filterText: { fontWeight: "800", color: c.secondaryText, fontSize: 12 },
  filterTextActive: { color: c.primaryText },

  centerCard: {
    flex: 1,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  titleEmpty: { fontSize: 16, fontWeight: "900", color: c.primaryText },
  muted: { color: c.secondaryText, textAlign: "center" },

  card: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seller: { fontSize: 13, fontWeight: "900", color: c.primaryText },

  statusPill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  pillPending: { backgroundColor: c.accentSoft },
  pillAccepted: { backgroundColor: "#DCFCE7" },
  pillRejected: { backgroundColor: "#FEE2E2" },
  pillWithdrawn: { backgroundColor: "#E5E7EB" },
  statusText: { fontSize: 12, fontWeight: "900", color: c.primaryText },

  price: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "900",
    color: c.primaryText,
  },
  desc: { marginTop: 6, color: c.secondaryText, lineHeight: 18 },

  slotsWrap: {
    marginTop: 8,
    gap: 4,
  },
  slotsLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  slotsBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  slotChip: {
    backgroundColor: c.accentSoft,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  slotChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: c.primary,
  },

  counterBox: {
    marginTop: 10,
    backgroundColor: c.bg,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    padding: 10,
    gap: 4,
  },
  counterTitle: { fontWeight: "900", color: c.primaryText },
  counterMsg: { color: c.secondaryText },
  counterStatus: {
    fontSize: 12,
    fontWeight: "900",
    color: c.secondaryText,
  },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: c.primary },
  btnPrimaryText: { color: "white", fontWeight: "900" },
  btnSecondary: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  btnSecondaryText: { color: c.primaryText, fontWeight: "900" },

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
    color: c.danger,
    fontWeight: "800",
    fontSize: 12,
  },
  });
}
