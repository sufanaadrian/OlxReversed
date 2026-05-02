import { StyleSheet } from "react-native";
import type { Colors } from "../src/theme/colors";

export function makeStyles(c: Colors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.bg },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 22,
      paddingBottom: 48,
    },

    // ── Progress dots ───────────────────────────────────────────────
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingTop: 20,
      paddingBottom: 4,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.border,
    },
    dotActive: {
      width: 24,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.primary,
    },
    dotDone: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.primaryLight,
      borderWidth: 1.5,
      borderColor: c.primary,
    },

    // ── Nav row (back button) ────────────────────────────────────────
    navRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: 8,
      paddingBottom: 4,
      minHeight: 36,
    },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: c.surfaceAlt,
    },
    backBtnText: { fontSize: 14, fontWeight: "700", color: c.secondaryText },

    // ── Header ───────────────────────────────────────────────────────
    header: {
      alignItems: "center",
      paddingTop: 20,
      paddingBottom: 28,
      gap: 8,
    },
    emoji: { fontSize: 52, marginBottom: 4 },
    headerTitle: {
      fontSize: 26,
      fontWeight: "900",
      color: c.primaryText,
      textAlign: "center",
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 14,
      color: c.secondaryText,
      textAlign: "center",
      lineHeight: 20,
    },

    // ── Role cards ────────────────────────────────────────────────────
    roleGrid: { gap: 12, marginBottom: 8 },
    roleCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      padding: 18,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: c.border,
      backgroundColor: c.surface,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: c.isDark ? 0.2 : 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    roleCardSelected: {
      borderColor: c.primary,
      backgroundColor: c.primaryLight,
    },
    roleCardEmployerSelected: {
      borderColor: c.employer,
      backgroundColor: c.employerLight,
    },
    roleEmoji: { fontSize: 36 },
    roleContent: { flex: 1, gap: 2 },
    roleLabel: {
      fontSize: 17,
      fontWeight: "800",
      color: c.primaryText,
    },
    roleLabelSelected: { color: c.primaryDark },
    roleLabelEmployerSelected: { color: c.employer },
    roleDesc: {
      fontSize: 12,
      color: c.secondaryText,
      lineHeight: 16,
    },
    roleCheck: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    roleCheckEmployer: { backgroundColor: c.employer },

    // ── Section ───────────────────────────────────────────────────────
    section: { marginBottom: 18 },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "800",
      color: c.mutedText,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 8,
    },

    // ── Input ─────────────────────────────────────────────────────────
    input: {
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      color: c.primaryText,
      marginBottom: 10,
    },
    inputFocused: { borderColor: c.primary },

    // ── Skills chips (step 2 student) ─────────────────────────────────
    skillsHint: {
      fontSize: 12,
      color: c.mutedText,
      marginBottom: 8,
      lineHeight: 16,
    },
    skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    skillChip: {
      paddingVertical: 6,
      paddingHorizontal: 13,
      borderRadius: 999,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    skillChipActive: {
      backgroundColor: c.primaryLight,
      borderColor: c.primary,
    },
    skillChipText: { fontSize: 13, fontWeight: "600", color: c.secondaryText },
    skillChipTextActive: { color: c.primaryDark, fontWeight: "700" },

    // ── Terms row ─────────────────────────────────────────────────────
    termsRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 24,
      marginTop: 8,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    checkboxChecked: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    checkmark: { fontSize: 13, color: "#FFFFFF", fontWeight: "800" },
    termsText: {
      flex: 1,
      fontSize: 13,
      color: c.secondaryText,
      lineHeight: 18,
    },
    termsLink: { color: c.primary, fontWeight: "700" },

    // ── Buttons ───────────────────────────────────────────────────────
    nextBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: c.primary,
      marginTop: 4,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
    nextBtnDisabled: {
      backgroundColor: c.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    nextBtnText: { fontSize: 16, fontWeight: "900", color: "#FFFFFF" },
    nextBtnTextDisabled: { color: c.mutedText },

    // ── Optional label ────────────────────────────────────────────────
    optionalTag: {
      fontSize: 11,
      color: c.mutedText,
      fontWeight: "600",
    },
    inputLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: c.primaryText,
    },
  });
}
