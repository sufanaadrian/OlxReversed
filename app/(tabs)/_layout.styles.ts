import { StyleSheet } from "react-native";
import type { Colors } from "../../src/theme/colors";

export function makeStyles(c: Colors) {
  return StyleSheet.create({
  // this reserves the middle "tab slot" width
  plusSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // the actual plus button
  plusBtn: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: c.primary,
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
    backgroundColor: c.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderColor: c.border,
  },

  sheetTitle: { fontSize: 18, fontWeight: "800", color: c.primaryText },
  sheetSubtitle: { marginTop: 4, color: c.secondaryText },

  actionCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    flexDirection: "row",
    gap: 12,
    backgroundColor: c.surface,
  },
  actionIcon: {
    height: 40,
    width: 40,
    borderRadius: 14,
    backgroundColor: c.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: 15, fontWeight: "800", color: c.primaryText },
  actionDesc: { marginTop: 2, fontSize: 13, color: c.secondaryText },

  closeBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: 14,
    backgroundColor: c.bg,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { fontWeight: "700", color: c.primaryText },
  });
}
