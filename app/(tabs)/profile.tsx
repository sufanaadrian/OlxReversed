import { Feather } from "@expo/vector-icons";
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
  username: string | null;
  university: string | null;
  study_year: number | null;
  bio: string | null;
  skills: string[] | null;
  user_type: string | null;
  created_at: string | null;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [postsCount, setPostsCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const t = useTranslation();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setEmail(user.email ?? null);

    const [{ data: prof }, { count: posts }, { count: apps }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select(
            "username, university, study_year, bio, skills, user_type, created_at",
          )
          .eq("id", user.id)
          .single(),
        supabase
          .from("requests")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("offers")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", user.id),
      ]);

    setProfile(prof as ProfileData | null);
    setPostsCount(posts ?? 0);
    setApplicationsCount(apps ?? 0);
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/sign-in");
  }

  if (loading) {
    return (
      <View style={styles.page}>
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={theme.primary}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.scroll}>
      {/* Avatar + name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>
            {(profile?.username ?? email ?? "?")[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.username ?? t("anonymous")}</Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}
        {profile?.user_type ? (
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor:
                  profile.user_type === "employer"
                    ? theme.employerLight
                    : theme.primaryLight,
              },
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                {
                  color:
                    profile.user_type === "employer"
                      ? theme.employer
                      : theme.primary,
                },
              ]}
            >
              {t(profile.user_type)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{postsCount}</Text>
          <Text style={styles.statLabel}>{t("posts")}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{applicationsCount}</Text>
          <Text style={styles.statLabel}>{t("applications")}</Text>
        </View>
      </View>

      {/* Bio */}
      {profile?.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("about")}</Text>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>
      ) : null}

      {/* University */}
      {profile?.university || profile?.study_year ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("education")}</Text>
          {profile.university ? (
            <View style={styles.infoRow}>
              <Feather name="book" size={14} color={theme.secondaryText} />
              <Text style={styles.infoText}>{profile.university}</Text>
            </View>
          ) : null}
          {profile.study_year ? (
            <View style={styles.infoRow}>
              <Feather name="calendar" size={14} color={theme.secondaryText} />
              <Text style={styles.infoText}>
                {t("year")} {profile.study_year}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Skills */}
      {profile?.skills && profile.skills.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("skills")}</Text>
          <View style={styles.skillsRow}>
            {profile.skills.map((s, i) => (
              <View key={i} style={styles.skillChip}>
                <Text style={styles.skillChipText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings")}</Text>

        {/* Language */}
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Feather name="globe" size={16} color={theme.secondaryText} />
            <Text style={styles.settingLabel}>{t("language")}</Text>
          </View>
          <View style={styles.toggleRow}>
            {(["en", "ro"] as const).map((lang) => (
              <Pressable
                key={lang}
                style={[
                  styles.langBtn,
                  language === lang && styles.langBtnActive,
                ]}
                onPress={() => setLanguage(lang)}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    language === lang && styles.langBtnTextActive,
                  ]}
                >
                  {lang.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Currency */}
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Feather name="dollar-sign" size={16} color={theme.secondaryText} />
            <Text style={styles.settingLabel}>{t("currency")}</Text>
          </View>
          <View style={styles.toggleRow}>
            {(["ron", "eur"] as const).map((cur) => (
              <Pressable
                key={cur}
                style={[
                  styles.langBtn,
                  currency === cur && styles.langBtnActive,
                ]}
                onPress={() => setCurrency(cur)}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    currency === cur && styles.langBtnTextActive,
                  ]}
                >
                  {cur.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Sign Out */}
      <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
        <Feather name="log-out" size={16} color={theme.error} />
        <Text style={styles.signOutText}>{t("signOut")}</Text>
      </Pressable>
    </ScrollView>
  );
}
