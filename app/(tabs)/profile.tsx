import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useCurrency } from "../../src/context/CurrencyContext";
import { useLanguage, useTranslation } from "../../src/context/LanguageContext";
import { supabase } from "../../src/lib/supabase";
import { styles, theme } from "./profile.styles";

type ProfileData = {
  display_name: string | null;
  phone: string | null;
  city: string | null;
  account_type: string | null;
  intent: string | null;
  created_at: string | null;
};

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [requestsCount, setRequestsCount] = useState(0);
  const [dealsCount, setDealsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const t = useTranslation();

  const loadProfile = async () => {
    setIsLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setEmail(null);
      setProfileData(null);
      setRequestsCount(0);
      setDealsCount(0);
      setIsLoading(false);
      return;
    }

    setEmail(user.email ?? null);

    const [profileRes, requestsRes, dealsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name,phone,city,account_type,intent,created_at")
        .eq("id", user.id)
        .single(),
      supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("offers")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", user.id)
        .eq("status", "accepted"),
    ]);

    setProfileData((profileRes.data as ProfileData) ?? null);
    setRequestsCount(requestsRes.count ?? 0);
    setDealsCount(dealsRes.count ?? 0);
    setIsLoading(false);
  };

  useEffect(() => {
    loadProfile();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const isLoggedIn = !!email;
  const isBusiness = profileData?.account_type === "business";

  const displayName = profileData?.display_name ?? null;
  const initials = displayName
    ? displayName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : (email?.[0] ?? "U").toUpperCase();

  const memberSinceStr = profileData?.created_at
    ? new Date(profileData.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
      })
    : null;

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {isLoggedIn ? (
        <>
          {/* Hero card */}
          <View style={styles.heroCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <Text style={styles.displayName}>{displayName ?? t("user")}</Text>

            {/* Chips */}
            <View style={styles.chipsRow}>
              {profileData?.city ? (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>📍 {profileData.city}</Text>
                </View>
              ) : null}

              {profileData?.account_type ? (
                <View style={[styles.chip, isBusiness && styles.chipBusiness]}>
                  <Text
                    style={[
                      styles.chipText,
                      isBusiness && styles.chipTextBusiness,
                    ]}
                  >
                    {isBusiness ? "🏢" : "👤"}{" "}
                    {isBusiness ? t("business") : t("individual")}
                  </Text>
                </View>
              ) : null}

              {profileData?.intent ? (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    {profileData.intent === "buy"
                      ? `🛒 ${t("intentBuy")}`
                      : profileData.intent === "sell"
                        ? `🏪 ${t("intentSell")}`
                        : `🔄 ${t("intentBoth")}`}
                  </Text>
                </View>
              ) : null}
            </View>

            {memberSinceStr ? (
              <Text style={styles.memberSince}>
                {t("memberSince")} {memberSinceStr}
              </Text>
            ) : null}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{requestsCount}</Text>
              <Text style={styles.statLabel}>{t("activeRequests")}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{dealsCount}</Text>
              <Text style={styles.statLabel}>{t("acceptedDeals")}</Text>
            </View>
          </View>
        </>
      ) : (
        /* Guest hero */
        <View style={styles.guestCard}>
          <View style={styles.guestAvatar}>
            <Text style={{ fontSize: 28 }}>👤</Text>
          </View>
          <Text style={styles.guestTitle}>{t("guest")}</Text>
          <Text style={styles.guestSub}>{t("signInToSeeProfile")}</Text>
          <Pressable
            style={styles.signInBtn}
            onPress={() =>
              router.push({
                pathname: "/sign-in",
                params: { redirect: "/(tabs)/profile" },
              } as any)
            }
          >
            <Text style={styles.signInBtnText}>{t("signIn")}</Text>
          </Pressable>
        </View>
      )}

      {/* Settings section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("settings")}</Text>
        </View>

        {/* Language */}
        <View style={[styles.row, styles.rowFirst]}>
          <View style={styles.rowIcon}>
            <Text style={{ fontSize: 16 }}>🌐</Text>
          </View>
          <Text style={styles.rowLabel}>{t("language")}</Text>
        </View>
        <View style={styles.toggleRow}>
          <Pressable
            style={[
              styles.toggleBtn,
              language === "en" && styles.toggleBtnActive,
            ]}
            onPress={() => setLanguage("en")}
          >
            <Text
              style={[
                styles.toggleBtnText,
                language === "en" && styles.toggleBtnTextActive,
              ]}
            >
              🇬🇧 English
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleBtn,
              language === "ro" && styles.toggleBtnActive,
            ]}
            onPress={() => setLanguage("ro")}
          >
            <Text
              style={[
                styles.toggleBtnText,
                language === "ro" && styles.toggleBtnTextActive,
              ]}
            >
              🇷🇴 Română
            </Text>
          </Pressable>
        </View>

        {/* Currency */}
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Text style={{ fontSize: 16 }}>💱</Text>
          </View>
          <Text style={styles.rowLabel}>{t("currency")}</Text>
        </View>
        <View style={styles.toggleRow}>
          <Pressable
            style={[
              styles.toggleBtn,
              currency === "ron" && styles.toggleBtnActive,
            ]}
            onPress={() => setCurrency("ron")}
          >
            <Text
              style={[
                styles.toggleBtnText,
                currency === "ron" && styles.toggleBtnTextActive,
              ]}
            >
              {t("ron")}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleBtn,
              currency === "eur" && styles.toggleBtnActive,
            ]}
            onPress={() => setCurrency("eur")}
          >
            <Text
              style={[
                styles.toggleBtnText,
                currency === "eur" && styles.toggleBtnTextActive,
              ]}
            >
              {t("eur")}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Account section */}
      {isLoggedIn && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("accountInfo")}</Text>
          </View>

          <View style={[styles.row, styles.rowFirst]}>
            <View style={styles.rowIcon}>
              <Text style={{ fontSize: 16 }}>📧</Text>
            </View>
            <Text style={styles.rowLabel}>{t("emailPlaceholder")}</Text>
            <Text style={styles.rowValue}>{email}</Text>
          </View>

          {profileData?.phone ? (
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Text style={{ fontSize: 16 }}>📱</Text>
              </View>
              <Text style={styles.rowLabel}>{t("phone")}</Text>
              <Text style={styles.rowValue}>{profileData.phone}</Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <View style={[styles.rowIcon, styles.rowIconDanger]}>
              <Text style={{ fontSize: 16 }}>🚪</Text>
            </View>
            <Pressable style={{ flex: 1 }} onPress={handleSignOut}>
              <Text style={[styles.rowLabel, styles.rowLabelDanger]}>
                {t("logOut")}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      <Text style={styles.version}>{t("version")} 1.0.0</Text>
    </ScrollView>
  );
}
