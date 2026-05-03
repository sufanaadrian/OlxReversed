import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage, useTranslation } from "../src/context/LanguageContext";
import { useTheme } from "../src/context/ThemeContext";
import { makeStyles } from "./welcome.styles";

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useTranslation();
  const { language, setLanguage } = useLanguage();

  // Front card floats up/down
  const floatY = useSharedValue(0);
  // Graduation cap floats at a different pace for natural feel
  const capY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(-14, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    capY.value = withRepeat(
      withTiming(-9, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const frontCardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { rotateZ: "-2deg" }],
  }));

  const capAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: capY.value }],
  }));

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Language toggle — top left */}
      <View style={styles.header}>
        <View style={styles.langToggle}>
          <Pressable
            onPress={() => setLanguage("ro")}
            style={[styles.langBtn, language === "ro" && styles.langBtnActive]}
          >
            <Text
              style={[
                styles.langText,
                language === "ro" && styles.langTextActive,
              ]}
            >
              RO
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setLanguage("en")}
            style={[styles.langBtn, language === "en" && styles.langBtnActive]}
          >
            <Text
              style={[
                styles.langText,
                language === "en" && styles.langTextActive,
              ]}
            >
              EN
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 3D card fan hero */}
      <View style={styles.heroArea}>
        <View style={styles.cardStack}>
          {/* Floating graduation cap above the stack */}
          <Animated.View style={[styles.capContainer, capAnimStyle]}>
            <Text style={styles.capEmoji}>🎓</Text>
          </Animated.View>

          {/* Back-left card (Events) */}
          <View style={[styles.card, styles.cardBackLeft]}>
            <Text style={styles.cardEmoji}>🎉</Text>
            <Text style={styles.cardBackLabel}>{t("welcomeSlide1Label")}</Text>
          </View>

          {/* Back-right card (Hospitality) */}
          <View style={[styles.card, styles.cardBackRight]}>
            <Text style={styles.cardEmoji}>🍽️</Text>
            <Text style={styles.cardBackLabel}>{t("welcomeSlide3Label")}</Text>
          </View>

          {/* Front floating card (IT & Tech) */}
          <Animated.View
            style={[styles.card, styles.cardFront, frontCardAnimStyle]}
          >
            <Text style={styles.cardEmoji}>💻</Text>
            <Text style={styles.cardFrontLabel}>{t("welcomeSlide2Label")}</Text>
            <Text style={styles.cardFrontDesc}>{t("welcomeSlide2Desc")}</Text>
          </Animated.View>
        </View>
      </View>

      {/* Branding + CTAs */}
      <View style={styles.bottom}>
        <Text style={styles.appName}>StudentJobs</Text>
        <Text style={styles.tagline}>{t("welcomeTagline")}</Text>

        <Pressable
          style={styles.createBtn}
          onPress={() => router.push("/sign-up" as any)}
        >
          <Text style={styles.createBtnText}>{t("welcomeCreateAccount")}</Text>
        </Pressable>

        <View style={styles.signInRow}>
          <Text style={styles.signInPrompt}>{t("welcomeHaveAccount")}</Text>
          <Pressable onPress={() => router.push("/sign-in" as any)}>
            <Text style={styles.signInLink}>{t("welcomeSignInLink")}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
