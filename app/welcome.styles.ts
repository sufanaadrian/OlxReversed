import { Dimensions, StyleSheet } from "react-native";
import type { Colors } from "../src/theme/colors";

const { width } = Dimensions.get("window");

export const CARD_W = Math.min(260, width - 80);
export const CARD_H = 160;
export const CAP_AREA = 72;

export function makeStyles(c: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 4,
    },
    langToggle: {
      flexDirection: "row",
      backgroundColor: c.surfaceAlt,
      borderRadius: 10,
      padding: 3,
      gap: 2,
    },
    langBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 7,
    },
    langBtnActive: {
      backgroundColor: c.primary,
    },
    langText: {
      fontSize: 13,
      fontWeight: "700",
      color: c.secondaryText,
    },
    langTextActive: {
      color: "#FFFFFF",
    },
    heroArea: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    cardStack: {
      width: CARD_W,
      height: CARD_H + CAP_AREA,
      overflow: "visible",
    },
    capContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 20,
    },
    capEmoji: {
      fontSize: 54,
    },
    card: {
      position: "absolute",
      bottom: 0,
      left: 0,
      width: CARD_W,
      height: CARD_H,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    cardBackLeft: {
      backgroundColor: "#7C3AED",
      opacity: 0.82,
      transform: [{ rotateZ: "-16deg" }, { scale: 0.92 }],
    },
    cardBackRight: {
      backgroundColor: "#F97316",
      opacity: 0.82,
      transform: [{ rotateZ: "13deg" }, { scale: 0.92 }],
    },
    cardFront: {
      backgroundColor: "#0D9488",
      zIndex: 10,
      shadowColor: "#0D9488",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 14,
    },
    cardEmoji: {
      fontSize: 38,
      marginBottom: 8,
    },
    cardBackLabel: {
      fontSize: 14,
      fontWeight: "800",
      color: "rgba(255,255,255,0.75)",
      textAlign: "center",
    },
    cardFrontLabel: {
      fontSize: 20,
      fontWeight: "900",
      color: "#FFFFFF",
      textAlign: "center",
      letterSpacing: -0.4,
      marginBottom: 4,
    },
    cardFrontDesc: {
      fontSize: 13,
      color: "rgba(255,255,255,0.82)",
      textAlign: "center",
    },
    bottom: {
      paddingHorizontal: 28,
      paddingBottom: 32,
    },
    appName: {
      fontSize: 32,
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
      shadowOpacity: 0.4,
      shadowRadius: 12,
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
