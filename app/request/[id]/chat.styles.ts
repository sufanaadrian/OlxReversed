import { StyleSheet } from "react-native";

export const theme = {
  primary: "#1E40AF",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
};

export const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },

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

  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  avatar: { width: "100%", height: "100%" },
  avatarFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: { fontWeight: "900", color: theme.primaryText },

  headerTitle: { fontSize: 16, fontWeight: "900", color: theme.primaryText },
  headerSub: {
    fontSize: 12,
    color: theme.secondaryText,
    fontWeight: "800",
    marginTop: 2,
  },

  headerIconBtn: {
    height: 40,
    width: 40,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },

  contextCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  contextTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  contextTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    color: theme.primaryText,
    lineHeight: 18,
  },
  contextDescription: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.secondaryText,
    lineHeight: 18,
  },

  statusPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillText: { fontSize: 11, fontWeight: "900", color: theme.primaryText },
  pillOpen: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  pillNegotiating: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  pillClosed: { backgroundColor: "#FEE2E2", borderColor: "#FECACA" },

  contextMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  metaPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
  },
  metaPillText: { fontSize: 11, fontWeight: "900", color: theme.primaryText },

  closeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  closeBtn: {
    backgroundColor: theme.primaryText,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  closeBtnText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  closeBtnGhost: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.primaryText,
  },
  closeBtnTextGhost: { color: theme.primaryText },
  closeHint: { color: theme.secondaryText, fontWeight: "800", fontSize: 12 },

  btnDisabled: { opacity: 0.6 },

  emptyBox: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyTitle: { fontWeight: "900", color: theme.primaryText },
  emptySub: {
    color: theme.secondaryText,
    fontWeight: "700",
    textAlign: "center",
  },

  msgRow: { flexDirection: "row", marginVertical: 4 },
  msgRowMine: { justifyContent: "flex-end" },
  msgRowTheirs: { justifyContent: "flex-start" },

  msgBubble: {
    maxWidth: "78%",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  msgBubbleMine: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
    borderTopRightRadius: 6,
  },
  msgBubbleTheirs: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderTopLeftRadius: 6,
  },

  msgText: { fontWeight: "800", lineHeight: 18, fontSize: 14 },
  msgTextMine: { color: "#fff" },
  msgTextTheirs: { color: theme.primaryText },

  msgMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  msgTime: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "800",
    alignSelf: "flex-end",
  },
  msgTimeMine: { color: "rgba(255,255,255,0.75)" },
  msgTimeTheirs: { color: theme.secondaryText },

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingTop: 10,
    paddingBottom: 14,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.primaryText,
    fontWeight: "800",
  },
  contextExpanded: {
    marginTop: 8,
    gap: 10,
  },

  contextActionsRow: {
    flexDirection: "row",
    gap: 10,
  },

  contextActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#111827",
  },

  contextActionBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },

  contextActionBtnSecondary: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  contextActionBtnSecondaryText: {
    color: "#111827",
  },

  contextRightInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  sendBtn: {
    height: 44,
    width: 44,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dateSeparatorWrap: {
    alignItems: "center",
    marginVertical: 10,
  },

  dateSeparatorPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EEF2F7",
  },

  dateSeparatorText: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.7,
  },

  sendBtnDisabled: { opacity: 0.5 },

  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2F7",
    marginRight: 8,
  },

  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "white",
    padding: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    gap: 10,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "800",
    opacity: 0.7,
  },
  sheetItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F7F8FA",
  },
  sheetItemText: {
    fontSize: 14,
    fontWeight: "700",
  },
  sheetCancel: {
    backgroundColor: "#111827",
  },
  sheetCancelText: {
    color: "white",
    textAlign: "center",
  },

  mediaWrap: {
    overflow: "hidden",
    borderRadius: 14,
  },
  msgImage: {
    width: 240,
    height: 170,
    borderRadius: 14,
  },

  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
  },
  viewerTopBar: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  viewerCloseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  viewerCloseText: {
    color: "white",
    fontWeight: "700",
  },
  viewerImage: {
    width: "100%",
    height: "100%",
  },
});
