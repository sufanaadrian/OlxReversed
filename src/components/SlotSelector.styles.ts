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
  successSoft: "#DCFCE7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  amber: "#D97706",
  amberSoft: "#FEF3C7",
};

export const styles = StyleSheet.create({
  container: { gap: 10 },

  daySection: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    overflow: "hidden",
  },
  dayHeader: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: theme.bg,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: theme.primaryText,
  },

  slotBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  slotBtnLast: {
    borderBottomWidth: 0,
  },
  slotBtnSelected: {
    backgroundColor: theme.accentSoft,
  },
  slotBtnBooked: {
    backgroundColor: theme.dangerSoft,
    opacity: 0.6,
  },
  slotBtnPending: {
    backgroundColor: theme.amberSoft,
    opacity: 0.6,
  },

  slotTime: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.primaryText,
  },
  slotTimeBooked: {
    color: theme.danger,
    textDecorationLine: "line-through",
  },

  slotStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleSelected: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  checkMark: {
    fontSize: 12,
    fontWeight: "900",
    color: "#fff",
  },

  bookedPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: theme.dangerSoft,
  },
  bookedText: {
    fontSize: 10,
    fontWeight: "900",
    color: theme.danger,
  },
  pendingPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: theme.amberSoft,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: "900",
    color: theme.amber,
  },

  emptyText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.secondaryText,
    textAlign: "center",
    paddingVertical: 16,
  },

  selectedSummary: {
    backgroundColor: theme.accentSoft,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  selectedSummaryText: {
    fontSize: 13,
    fontWeight: "900",
    color: theme.primary,
  },
});
