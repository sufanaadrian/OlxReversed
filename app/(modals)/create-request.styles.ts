import { StyleSheet } from "react-native";
import type { Colors } from "../../src/theme/colors";

export function makeStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },

    // ── Header ───────────────────────────────────────────────────────
    header: {
      height: 54,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    headerTitle: { fontSize: 16, fontWeight: "900", color: c.primaryText },
    headerBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 },
    headerBtnText: { color: c.secondaryText, fontWeight: "800" },
    headerBtnPrimary: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: c.primary,
    },
    headerBtnPrimaryText: { color: "white", fontWeight: "900" },

    // ── Content ──────────────────────────────────────────────────────
    content: { padding: 16, paddingBottom: 40 },

    // ── Section cards ────────────────────────────────────────────────
    section: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "900",
      color: c.secondaryText,
      textTransform: "uppercase",
      letterSpacing: 0.7,
      marginBottom: 14,
    },

    // ── Labels & inputs ──────────────────────────────────────────────
    label: {
      fontSize: 13,
      fontWeight: "800",
      color: c.primaryText,
      marginBottom: 8,
      marginTop: 14,
    },
    labelFirst: { marginTop: 0 },
    input: {
      backgroundColor: c.bg,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: c.primaryText,
      fontSize: 14,
    },
    textarea: { height: 100, textAlignVertical: "top" },
    textareaSmall: { height: 72, textAlignVertical: "top" },
    row: { flexDirection: "row", alignItems: "center", gap: 10 },

    // ── Chips ────────────────────────────────────────────────────────
    chipsScroll: { gap: 8, paddingVertical: 2, paddingRight: 8 },
    chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: c.bg,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipActive: {
      backgroundColor: c.primaryLight,
      borderColor: c.primary,
    },
    chipText: { fontSize: 13, fontWeight: "700", color: c.secondaryText },
    chipTextActive: { color: c.primary, fontWeight: "900" },

    // ── Budget ───────────────────────────────────────────────────────
    budgetRow: { flexDirection: "row", gap: 10 },
    budgetInput: { flex: 1 },
    openBudgetPressable: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 10,
      paddingVertical: 4,
    },
    openBudgetCheckbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.bg,
      alignItems: "center",
      justifyContent: "center",
    },
    openBudgetCheckboxActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    openBudgetLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: c.primaryText,
    },

    // ── Workers stepper ──────────────────────────────────────────────
    stepperRow: { flexDirection: "row", alignItems: "center", gap: 14 },
    stepperBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: c.bg,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperBtnDisabled: { opacity: 0.35 },
    stepperBtnText: {
      fontSize: 22,
      fontWeight: "700",
      color: c.primaryText,
      lineHeight: 26,
    },
    stepperValue: {
      fontSize: 18,
      fontWeight: "900",
      color: c.primaryText,
      minWidth: 36,
      textAlign: "center",
    },

    // ── Photo grid ───────────────────────────────────────────────────
    photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    photoThumb: { width: 90, height: 90, borderRadius: 12, overflow: "hidden" },
    photoImg: { width: 90, height: 90 },
    photoOverlay: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "rgba(0,0,0,0.55)",
      alignItems: "center",
      justifyContent: "center",
    },
    addPhotoBtn: {
      width: 90,
      height: 90,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.border,
      borderStyle: "dashed",
      backgroundColor: c.bg,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    addPhotoBtnText: {
      fontSize: 11,
      fontWeight: "700",
      color: c.secondaryText,
    },
    photoHint: {
      fontSize: 12,
      color: c.secondaryText,
      marginTop: 8,
      lineHeight: 16,
    },

    // ── Submit ───────────────────────────────────────────────────────
    submitBtn: {
      marginTop: 4,
      height: 52,
      borderRadius: 16,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    submitBtnText: { fontSize: 15, fontWeight: "900", color: "white" },

    // ── Urgent toggle ────────────────────────────────────────────────
    urgentRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    urgentCheckbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.bg,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    urgentCheckboxActive: {
      backgroundColor: "#DC2626",
      borderColor: "#DC2626",
    },
    urgentLabel: { fontSize: 14, fontWeight: "700", color: c.primaryText },
    urgentHint: { fontSize: 12, color: c.mutedText, marginTop: 2 },

    // ── Posting-mode selector ────────────────────────────────────────
    modeRow: { flexDirection: "row", gap: 10 },
    modeCard: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.bg,
      padding: 14,
      alignItems: "center",
      gap: 6,
    },
    modeCardActive: {
      borderColor: c.primary,
      backgroundColor: c.primaryLight,
    },
    modeIcon: { fontSize: 24 },
    modeTitle: { fontSize: 13, fontWeight: "900", color: c.primaryText },
    modeDesc: {
      fontSize: 11,
      color: c.secondaryText,
      textAlign: "center",
      lineHeight: 15,
    },

    // ── Date range ──────────────────────────────────────────────────
    dateRangeRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 4,
    },
    dateLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: c.secondaryText,
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    hint: {
      fontSize: 12,
      color: c.secondaryText,
      marginBottom: 8,
      lineHeight: 17,
    },
    datePickerBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: c.surface,
    },
    datePickerBtnText: {
      fontSize: 14,
      fontWeight: "600",
      color: c.primaryText,
      flex: 1,
    },
    datePickerPlaceholder: {
      color: c.secondaryText,
      fontWeight: "500",
    },
    datePickerIcon: {
      fontSize: 16,
      marginLeft: 6,
    },
    datePickerInline: {
      marginTop: 8,
      alignItems: "center",
    },
    datePickerDone: {
      alignSelf: "flex-end",
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginTop: 4,
    },
    datePickerDoneText: {
      fontSize: 14,
      fontWeight: "700",
      color: c.primary,
    },

    // ── New simplified form styles ────────────────────────────────────
    flex: { flex: 1 },
    scroll: { paddingHorizontal: 16, paddingBottom: 32 },
    backBtn: { padding: 8 },

    toggleRow: { flexDirection: "row", gap: 10, marginTop: 6 },
    toggleBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: "center",
      backgroundColor: c.surface,
    },
    toggleBtnActive: { borderWidth: 1.5 },
    toggleBtnText: {
      fontSize: 14,
      fontWeight: "600",
      color: c.secondaryText,
    },

    catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
    catChip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    catChipSelected: {
      backgroundColor: c.primaryLight,
      borderColor: c.primary,
    },
    catChipText: { fontSize: 13, color: c.secondaryText, fontWeight: "600" },
    catChipTextSelected: { color: c.primaryDark, fontWeight: "700" },

    rangeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    rangeInput: { flex: 1 },
    rangeSep: { fontSize: 18, color: c.mutedText },

    inputMultiline: { height: 110, textAlignVertical: "top", paddingTop: 10 },

    // ── Template bar ─────────────────────────────────────────────────
    templateBar: {
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.primary,
      padding: 14,
      marginBottom: 12,
      marginTop: 4,
    },
    templateBarHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    templateBarTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      color: c.primary,
    },
    templateList: {
      marginTop: 10,
      gap: 6,
    },
    templateChip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: c.primaryLight,
      borderWidth: 1,
      borderColor: c.border,
    },
    templateChipText: {
      fontSize: 14,
      fontWeight: "700",
      color: c.primaryDark,
      flex: 1,
    },
    templateChipCat: {
      fontSize: 12,
      color: c.mutedText,
      fontWeight: "600",
    },
  });
}
