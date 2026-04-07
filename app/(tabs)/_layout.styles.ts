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
  // this reserves the middle "tab slot" width
  plusSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // the actual plus button
  plusBtn: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -15, // lifts above the tab bar like OLX
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,23,0.35)",
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderColor: theme.border,
  },

  sheetTitle: { fontSize: 18, fontWeight: "800", color: theme.primaryText },
  sheetSubtitle: { marginTop: 4, color: theme.secondaryText },

  actionCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    flexDirection: "row",
    gap: 12,
    backgroundColor: theme.surface,
  },
  actionIcon: {
    height: 40,
    width: 40,
    borderRadius: 14,
    backgroundColor: theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: 15, fontWeight: "800", color: theme.primaryText },
  actionDesc: { marginTop: 2, fontSize: 13, color: theme.secondaryText },

  closeBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { fontWeight: "700", color: theme.primaryText },
});
