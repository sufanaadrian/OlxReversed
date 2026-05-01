import { StyleSheet } from "react-native";

export const theme = {
  primary: "#0D9488",
  primaryLight: "#CCFBF1",
  primaryDark: "#0F766E",
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5F9",
  primaryText: "#0F172A",
  secondaryText: "#64748B",
  mutedText: "#94A3B8",
  border: "#E2E8F0",
  employer: "#7C3AED",
  employerLight: "#EDE9FE",
};

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },

  // ── Header ───────────────────────────────────────────────────────
  header: {
    height: 54,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  headerTitle: { fontSize: 16, fontWeight: "900", color: theme.primaryText },
  headerBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 },
  headerBtnText: { color: theme.secondaryText, fontWeight: "800" },
  headerBtnPrimary: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.primary,
  },
  headerBtnPrimaryText: { color: "white", fontWeight: "900" },

  // ── Content ──────────────────────────────────────────────────────
  content: { padding: 16, paddingBottom: 40 },

  // ── Section cards ────────────────────────────────────────────────
  section: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.secondaryText,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 14,
  },

  // ── Labels & inputs ──────────────────────────────────────────────
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.primaryText,
    marginBottom: 8,
    marginTop: 14,
  },
  labelFirst: { marginTop: 0 },
  input: {
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: theme.primaryText,
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
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipActive: {
    backgroundColor: theme.primaryLight,
    borderColor: theme.primary,
  },
  chipText: { fontSize: 13, fontWeight: "700", color: theme.secondaryText },
  chipTextActive: { color: theme.primary, fontWeight: "900" },

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
    borderColor: theme.border,
    backgroundColor: theme.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  openBudgetCheckboxActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  openBudgetLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.primaryText,
  },

  // ── Workers stepper ──────────────────────────────────────────────
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.primaryText,
    lineHeight: 26,
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.primaryText,
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
    borderColor: theme.border,
    borderStyle: "dashed",
    backgroundColor: theme.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addPhotoBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.secondaryText,
  },
  photoHint: {
    fontSize: 12,
    color: theme.secondaryText,
    marginTop: 8,
    lineHeight: 16,
  },

  // ── Submit ───────────────────────────────────────────────────────
  submitBtn: {
    marginTop: 4,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: { fontSize: 15, fontWeight: "900", color: "white" },

  // ── Posting-mode selector ────────────────────────────────────────
  modeRow: { flexDirection: "row", gap: 10 },
  modeCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.border,
    backgroundColor: theme.bg,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  modeCardActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryLight,
  },
  modeIcon: { fontSize: 24 },
  modeTitle: { fontSize: 13, fontWeight: "900", color: theme.primaryText },
  modeDesc: {
    fontSize: 11,
    color: theme.secondaryText,
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
    color: theme.secondaryText,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 12,
    color: theme.secondaryText,
    marginBottom: 8,
    lineHeight: 17,
  },
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.surface,
  },
  datePickerBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.primaryText,
    flex: 1,
  },
  datePickerPlaceholder: {
    color: theme.secondaryText,
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
    color: theme.primary,
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
    borderColor: theme.border,
    alignItems: "center",
    backgroundColor: theme.surface,
  },
  toggleBtnActive: { borderWidth: 1.5 },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.secondaryText,
  },

  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  catChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  catChipSelected: {
    backgroundColor: theme.primaryLight,
    borderColor: theme.primary,
  },
  catChipText: { fontSize: 13, color: theme.secondaryText, fontWeight: "600" },
  catChipTextSelected: { color: theme.primaryDark, fontWeight: "700" },

  rangeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rangeInput: { flex: 1 },
  rangeSep: { fontSize: 18, color: theme.mutedText },

  inputMultiline: { height: 110, textAlignVertical: "top", paddingTop: 10 },
});
