import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    ScrollView,
    Text,
    TextInput,
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
  cv_url: string | null;
  verified: boolean | null;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [postsCount, setPostsCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editUniversity, setEditUniversity] = useState("");
  const [editStudyYear, setEditStudyYear] = useState("");
  const [editSkillsRaw, setEditSkillsRaw] = useState("");
  const [editCvUrl, setEditCvUrl] = useState("");
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
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
            "username, university, study_year, bio, skills, user_type, created_at, cv_url, verified",
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

    // Load avg rating
    const { data: reviewRows } = await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewee_id", user.id);
    if (reviewRows && reviewRows.length > 0) {
      const avg =
        reviewRows.reduce((s: number, r: any) => s + r.rating, 0) /
        reviewRows.length;
      setAvgRating(Math.round(avg * 10) / 10);
      setRatingCount(reviewRows.length);
    } else {
      setAvgRating(null);
      setRatingCount(0);
    }

    setProfile(prof as ProfileData | null);
    setPostsCount(posts ?? 0);
    setApplicationsCount(apps ?? 0);
    setLoading(false);
  }

  function startEditing() {
    if (!profile) return;
    setEditUsername(profile.username ?? "");
    setEditBio(profile.bio ?? "");
    setEditUniversity(profile.university ?? "");
    setEditStudyYear(profile.study_year ? String(profile.study_year) : "");
    setEditSkillsRaw((profile.skills ?? []).join(", "));
    setEditCvUrl(profile.cv_url ?? "");
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const skills = editSkillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from("profiles")
      .update({
        username: editUsername.trim() || null,
        bio: editBio.trim() || null,
        university: editUniversity.trim() || null,
        study_year: editStudyYear ? parseInt(editStudyYear, 10) : null,
        skills: skills.length ? skills : null,
        cv_url: editCvUrl.trim() || null,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      Alert.alert(t("error"), t("profileSaveFailed"));
    } else {
      setEditing(false);
      loadProfile();
      Alert.alert(t("profileSaved"));
    }
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
        {profile?.verified && (
          <View style={styles.verifiedBadge}>
            <Feather name="check-circle" size={12} color="#0D9488" />
            <Text style={styles.verifiedText}>{t("verified")}</Text>
          </View>
        )}
        {!editing && (
          <Pressable style={styles.editBtn} onPress={startEditing}>
            <Feather name="edit-2" size={14} color={theme.primary} />
            <Text style={styles.editBtnText}>{t("editProfile")}</Text>
          </Pressable>
        )}
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
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          {avgRating !== null ? (
            <View style={styles.ratingRow}>
              <Text style={styles.statValue}>{avgRating.toFixed(1)}</Text>
              <Feather name="star" size={14} color="#F59E0B" />
            </View>
          ) : (
            <Text style={styles.statValue}>—</Text>
          )}
          <Text style={styles.statLabel}>
            {ratingCount > 0
              ? `${ratingCount} ${t("ratings")}`
              : t("noRatings")}
          </Text>
        </View>
      </View>

      {editing ? (
        /* ── Edit form ── */
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("editProfile")}</Text>

          <Text style={styles.fieldLabel}>{t("username")}</Text>
          <TextInput
            style={styles.fieldInput}
            value={editUsername}
            onChangeText={setEditUsername}
            placeholder={t("username")}
            placeholderTextColor={theme.mutedText}
          />

          <Text style={styles.fieldLabel}>{t("bio")}</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldTextarea]}
            value={editBio}
            onChangeText={setEditBio}
            placeholder="Introduce yourself…"
            placeholderTextColor={theme.mutedText}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.fieldLabel}>{t("university")}</Text>
          <TextInput
            style={styles.fieldInput}
            value={editUniversity}
            onChangeText={setEditUniversity}
            placeholder="e.g. UBB Cluj"
            placeholderTextColor={theme.mutedText}
          />

          <Text style={styles.fieldLabel}>{t("studyYear")}</Text>
          <TextInput
            style={styles.fieldInput}
            value={editStudyYear}
            onChangeText={setEditStudyYear}
            placeholder="1 – 6"
            placeholderTextColor={theme.mutedText}
            keyboardType="number-pad"
            maxLength={1}
          />

          <Text style={styles.fieldLabel}>{t("skills")}</Text>
          <TextInput
            style={styles.fieldInput}
            value={editSkillsRaw}
            onChangeText={setEditSkillsRaw}
            placeholder="React, Design, Excel…"
            placeholderTextColor={theme.mutedText}
          />
          <Text style={styles.fieldHint}>Separate skills with commas</Text>

          <Text style={styles.fieldLabel}>{t("cvLink")}</Text>
          <TextInput
            style={styles.fieldInput}
            value={editCvUrl}
            onChangeText={setEditCvUrl}
            placeholder={t("cvLinkPlaceholder")}
            placeholderTextColor={theme.mutedText}
            autoCapitalize="none"
            keyboardType="url"
          />

          <View style={styles.editActions}>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => setEditing(false)}
            >
              <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? "…" : t("save")}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* ── View mode ── */
        <>
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
                  <Feather
                    name="calendar"
                    size={14}
                    color={theme.secondaryText}
                  />
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

          {/* CV link */}
          {profile?.cv_url ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("cvLink")}</Text>
              <Pressable
                style={styles.cvLinkRow}
                onPress={() => Linking.openURL(profile.cv_url!)}
              >
                <Feather name="external-link" size={14} color={theme.primary} />
                <Text style={styles.cvLinkText} numberOfLines={1}>
                  {profile.cv_url}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}

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
