import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../src/context/LanguageContext";
import { supabase } from "../../src/lib/supabase";
import { styles, theme } from "./[userId].styles";

type CVProfile = {
  id: string;
  username: string | null;
  bio: string | null;
  university: string | null;
  study_year: number | null;
  skills: string[] | null;
  user_type: string | null;
  verified: boolean | null;
  linkedin_url: string | null;
  created_at: string | null;
};

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function CVScreen() {
  const t = useTranslation();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profile, setProfile] = useState<CVProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, username, bio, university, study_year, skills, user_type, verified, linkedin_url, created_at",
        )
        .eq("id", userId)
        .single();
      setProfile(data as CVProfile | null);
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={theme.primary}
        />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t("profileNotFound")}</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{t("back")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isStudent = profile.user_type !== "employer";
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
      })
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <Pressable onPress={() => router.back()} style={styles.navBtn}>
          <Feather name="arrow-left" size={20} color={theme.primaryText} />
        </Pressable>
        <Text style={styles.navTitle}>{t("cvScreenTitle")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{initials(profile.username)}</Text>
          </View>
          <Text style={styles.name}>{profile.username ?? t("anonymous")}</Text>
          <View style={styles.badgeRow}>
            {profile.user_type ? (
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor: isStudent
                      ? theme.primaryLight
                      : theme.employerLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeBadgeText,
                    { color: isStudent ? theme.primary : theme.employer },
                  ]}
                >
                  {t(profile.user_type)}
                </Text>
              </View>
            ) : null}
            {profile.verified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={12} color={theme.primary} />
                <Text style={styles.verifiedText}>{t("verified")}</Text>
              </View>
            )}
          </View>
          {memberSince ? (
            <Text style={styles.memberSince}>
              {t("memberSince")} {memberSince}
            </Text>
          ) : null}
        </View>

        {/* Bio */}
        {profile.bio ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="user" size={15} color={theme.primary} />
              <Text style={styles.sectionTitle}>{t("about")}</Text>
            </View>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        ) : null}

        {/* Education */}
        {profile.university || profile.study_year ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="book" size={15} color={theme.primary} />
              <Text style={styles.sectionTitle}>{t("education")}</Text>
            </View>
            {profile.university ? (
              <Text style={styles.infoText}>{profile.university}</Text>
            ) : null}
            {profile.study_year ? (
              <Text style={styles.infoSubText}>
                {t("year")} {profile.study_year}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="zap" size={15} color={theme.primary} />
              <Text style={styles.sectionTitle}>{t("skills")}</Text>
            </View>
            <View style={styles.skillsRow}>
              {profile.skills.map((s, i) => (
                <View key={i} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* LinkedIn */}
        {profile.linkedin_url ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="link" size={15} color={theme.primary} />
              <Text style={styles.sectionTitle}>{t("linkedinUrl")}</Text>
            </View>
            <Pressable
              style={styles.linkedinBtn}
              onPress={() => {
                const url = profile.linkedin_url!;
                const safe =
                  url.startsWith("http://") || url.startsWith("https://")
                    ? url
                    : `https://${url}`;
                Linking.openURL(safe);
              }}
            >
              <Feather name="external-link" size={14} color={theme.linkedin} />
              <Text style={styles.linkedinBtnText}>{t("openLinkedIn")}</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
