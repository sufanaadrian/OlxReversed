import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
    Circle,
    Defs,
    Ellipse,
    LinearGradient,
    Path,
    Stop,
} from "react-native-svg";
import { useLanguage, useTranslation } from "../src/context/LanguageContext";
import { useTheme } from "../src/context/ThemeContext";
import { makeStyles } from "./welcome.styles";

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useTranslation();
  const { language, setLanguage } = useLanguage();

  const floatProgress = useSharedValue(0);
  const orbitProgress = useSharedValue(0);
  const pulseProgress = useSharedValue(0);

  useEffect(() => {
    floatProgress.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    orbitProgress.value = withRepeat(
      withTiming(1, { duration: 5600, easing: Easing.linear }),
      -1,
      false,
    );
    pulseProgress.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [floatProgress, orbitProgress, pulseProgress]);

  const sceneAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatProgress.value, [0, 1], [0, -14]) },
      {
        rotateZ: `${interpolate(floatProgress.value, [0, 1], [-1.5, 1.5])}deg`,
      },
    ],
  }));

  const haloAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pulseProgress.value, [0, 1], [0.94, 1.08]) },
    ],
    opacity: interpolate(pulseProgress.value, [0, 1], [0.32, 0.6]),
  }));

  const leftChipAnimStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          orbitProgress.value,
          [0, 0.5, 1],
          [-10, -34, -10],
        ),
      },
      {
        translateY: interpolate(orbitProgress.value, [0, 0.5, 1], [8, -20, 8]),
      },
      {
        rotateZ: `${interpolate(orbitProgress.value, [0, 0.5, 1], [-8, -16, -8])}deg`,
      },
    ],
  }));

  const rightChipAnimStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(orbitProgress.value, [0, 0.5, 1], [12, 34, 12]),
      },
      {
        translateY: interpolate(orbitProgress.value, [0, 0.5, 1], [-6, 18, -6]),
      },
      {
        rotateZ: `${interpolate(orbitProgress.value, [0, 0.5, 1], [10, 16, 10])}deg`,
      },
    ],
  }));

  const badgeAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatProgress.value, [0, 1], [0, -8]) },
      { rotateZ: `${interpolate(floatProgress.value, [0, 1], [4, -4])}deg` },
    ],
  }));

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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

      <View style={styles.heroArea}>
        <Animated.View style={[styles.heroHalo, haloAnimStyle]} />
        <Animated.View style={[styles.badgeLeft, leftChipAnimStyle]}>
          <Text style={styles.badgeText}>{t("welcomeSlide1Label")}</Text>
        </Animated.View>
        <Animated.View style={[styles.badgeRight, rightChipAnimStyle]}>
          <Text style={styles.badgeText}>{t("welcomeSlide3Label")}</Text>
        </Animated.View>
        <Animated.View style={[styles.badgeBottom, badgeAnimStyle]}>
          <Text style={styles.badgeText}>{t("welcomeSlide4Label")}</Text>
        </Animated.View>

        <Animated.View style={[styles.sceneWrap, sceneAnimStyle]}>
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 360 320"
            style={styles.sceneSvg}
          >
            <Defs>
              <LinearGradient id="orb" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.9" />
                <Stop offset="100%" stopColor="#5EEAD4" stopOpacity="0.2" />
              </LinearGradient>
              <LinearGradient id="desk" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#0D9488" stopOpacity="0.22" />
                <Stop offset="100%" stopColor="#F97316" stopOpacity="0.08" />
              </LinearGradient>
            </Defs>
            <Circle cx="86" cy="84" r="58" fill="url(#orb)" />
            <Circle cx="286" cy="92" r="34" fill="#FDBA74" fillOpacity="0.28" />
            <Path
              d="M92 64 C148 24, 236 24, 290 92"
              stroke="#CBD5E1"
              strokeOpacity="0.7"
              strokeWidth="2"
              strokeDasharray="8 10"
              fill="none"
            />
            <Ellipse cx="180" cy="272" rx="106" ry="24" fill="url(#desk)" />
          </Svg>

          <View style={styles.backSheetLeft} />
          <View style={styles.backSheetRight} />
          <View style={styles.studentCard}>
            <View style={styles.studentHeaderRow}>
              <View style={styles.profilePill}>
                <View style={styles.profileDot} />
                <Text style={styles.profilePillText}>StudentJobs</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {t("welcomeSlide2Label")}
                </Text>
              </View>
            </View>

            <View style={styles.avatarWrap}>
              <View style={styles.avatarHair} />
              <View style={styles.avatarHead} />
              <View style={styles.avatarBody} />
              <View style={styles.laptopBase} />
              <View style={styles.laptopScreen} />
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricCardPrimary}>
                <Text style={styles.metricLabel}>{t("welcomeSlide2Desc")}</Text>
              </View>
              <View style={styles.metricCardSecondary}>
                <Text style={styles.metricLabel}>{t("welcomeSubtitle")}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.appName}>StudentJobs</Text>
        <Text style={styles.tagline}>{t("welcomeTagline")}</Text>
        <Text style={styles.subtitle}>{t("welcomeSubtitle")}</Text>

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
