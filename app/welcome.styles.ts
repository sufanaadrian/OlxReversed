import { Dimensions, StyleSheet } from "react-native";
import type { Colors } from "../src/theme/colors";

const { width } = Dimensions.get("window");

export function makeStyles(c: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    slidesContainer: {
      height: "58%",
      position: "relative",
    },
    flatList: {
      flex: 1,
    },
    slide: {
      width,
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    slideCard: {
      width: "100%",
      borderRadius: 28,
      paddingVertical: 48,
      paddingHorizontal: 32,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 20,
      elevation: 10,
    },
    slideEmoji: {
      fontSize: 64,
      marginBottom: 20,
    },
    slideLabel: {
      fontSize: 22,
      fontWeight: "900",
      color: "#FFFFFF",
      textAlign: "center",
      letterSpacing: -0.4,
      marginBottom: 8,
    },
    slideDesc: {
      fontSize: 15,
      color: "rgba(255,255,255,0.82)",
      textAlign: "center",
      lineHeight: 22,
    },
    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      paddingVertical: 16,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: c.border,
    },
    dotActive: {
      width: 22,
      backgroundColor: c.primary,
    },
    bottom: {
      flex: 1,
      paddingHorizontal: 28,
      paddingBottom: 32,
      justifyContent: "flex-end",
    },
    appName: {
      fontSize: 30,
      fontWeight: "900",
      color: c.primaryText,
      letterSpacing: -1,
      marginBottom: 6,
    },
    tagline: {
      fontSize: 16,
      color: c.secondaryText,
      lineHeight: 24,
      marginBottom: 32,
    },
    createBtn: {
      height: 54,
      borderRadius: 16,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    createBtnText: {
      color: "#FFFFFF",
      fontWeight: "900",
      fontSize: 16,
      letterSpacing: 0.2,
    },
    signInRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 4,
    },
    signInPrompt: {
      fontSize: 14,
      color: c.secondaryText,
    },
    signInLink: {
      fontSize: 14,
      fontWeight: "800",
      color: c.primary,
    },
  });
}
