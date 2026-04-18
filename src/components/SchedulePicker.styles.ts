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

  // ── Day row ──────────────────────────────────────────────────────
  dayRow: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dayHeaderActive: {
    backgroundColor: theme.accentSoft,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: theme.primaryText,
  },
  dayLabelActive: {
    color: theme.primary,
  },
  dayToggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.border,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  dayToggleActive: {
    backgroundColor: theme.primary,
  },
  dayToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  dayToggleThumbActive: {
    alignSelf: "flex-end",
  },

  // ── Slots inside a day ───────────────────────────────────────────
  slotsWrap: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 8,
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slotTimeBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  slotTimeText: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.primaryText,
  },
  slotDash: {
    fontSize: 14,
    fontWeight: "900",
    color: theme.secondaryText,
  },
  removeSlotBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  removeSlotText: {
    fontSize: 14,
    fontWeight: "900",
    color: theme.danger,
  },
  addSlotBtn: {
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.primary,
    borderStyle: "dashed",
    backgroundColor: theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  addSlotText: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.primary,
  },

  // ── Booked indicator ─────────────────────────────────────────────
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
  availablePill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: theme.successSoft,
  },
  availableText: {
    fontSize: 10,
    fontWeight: "900",
    color: theme.success,
  },

  // ── Time picker modal ────────────────────────────────────────────
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerCard: {
    width: 300,
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.primaryText,
    textAlign: "center",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  pickerDigitBtn: {
    width: 50,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerDigitBtnActive: {
    backgroundColor: theme.accentSoft,
    borderColor: theme.primary,
  },
  pickerDigitText: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.primaryText,
  },
  pickerColon: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.secondaryText,
  },
  pickerActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  pickerCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerCancelText: {
    fontWeight: "900",
    color: theme.primaryText,
    fontSize: 14,
  },
  pickerConfirmBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerConfirmText: {
    fontWeight: "900",
    color: "#fff",
    fontSize: 14,
  },

  // ── Quick presets ────────────────────────────────────────────────
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  presetChipActive: {
    backgroundColor: theme.accentSoft,
    borderColor: theme.primary,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.secondaryText,
  },
  presetChipTextActive: {
    color: theme.primary,
    fontWeight: "900",
  },

  // ── Empty state ──────────────────────────────────────────────────
  emptyHint: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.secondaryText,
    textAlign: "center",
    paddingVertical: 12,
  },
});
