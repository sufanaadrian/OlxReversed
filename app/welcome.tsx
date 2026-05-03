import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    FlatList,
    Pressable,
    Text,
    View,
    ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../src/context/LanguageContext";
import { useTheme } from "../src/context/ThemeContext";
import { makeStyles } from "./welcome.styles";

const { width } = Dimensions.get("window");

type Slide = {
  key: string;
  emojiKey: string;
  labelKey: string;
  descKey: string;
  cardColor: string;
};

const SLIDES: Slide[] = [
  {
    key: "events",
    emojiKey: "🎉",
    labelKey: "welcomeSlide1Label",
    descKey: "welcomeSlide1Desc",
    cardColor: "#7C3AED",
  },
  {
    key: "it",
    emojiKey: "💻",
    labelKey: "welcomeSlide2Label",
    descKey: "welcomeSlide2Desc",
    cardColor: "#0D9488",
  },
  {
    key: "hospitality",
    emojiKey: "🍽️",
    labelKey: "welcomeSlide3Label",
    descKey: "welcomeSlide3Desc",
    cardColor: "#F97316",
  },
  {
    key: "tutoring",
    emojiKey: "📚",
    labelKey: "welcomeSlide4Label",
    descKey: "welcomeSlide4Desc",
    cardColor: "#0EA5E9",
  },
];

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useTranslation();

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dotAnims = useRef(SLIDES.map(() => new Animated.Value(0))).current;

  function animateDots(index: number) {
    SLIDES.forEach((_, i) => {
      Animated.spring(dotAnims[i], {
        toValue: i === index ? 1 : 0,
        useNativeDriver: false,
        stiffness: 200,
        damping: 20,
      }).start();
    });
  }

  useEffect(() => {
    animateDots(0);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % SLIDES.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        animateDots(next);
        return next;
      });
    }, 3200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        const idx = viewableItems[0].index;
        setActiveIndex(idx);
        animateDots(idx);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Auto-sliding job category cards */}
      <View style={styles.slidesContainer}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          style={styles.flatList}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <View
                style={[styles.slideCard, { backgroundColor: item.cardColor }]}
              >
                <Text style={styles.slideEmoji}>{item.emojiKey}</Text>
                <Text style={styles.slideLabel}>{t(item.labelKey)}</Text>
                <Text style={styles.slideDesc}>{t(item.descKey)}</Text>
              </View>
            </View>
          )}
        />
      </View>

      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {SLIDES.map((slide, i) => {
          const dotWidth = dotAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [7, 22],
          });
          const dotColor = dotAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [colors.border, colors.primary],
          });
          return (
            <Animated.View
              key={slide.key}
              style={[
                styles.dot,
                { width: dotWidth, backgroundColor: dotColor },
              ]}
            />
          );
        })}
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
