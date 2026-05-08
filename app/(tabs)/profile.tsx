import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { ImageViewer } from "../../src/components/ImageViewer";
import { useCurrency } from "../../src/context/CurrencyContext";
import { useLanguage, useTranslation } from "../../src/context/LanguageContext";
import { useMarketplaceMode } from "../../src/context/MarketplaceModeContext";
import { useTheme } from "../../src/context/ThemeContext";
import { supabase } from "../../src/lib/supabase";
import { makeStyles } from "./profile.styles";

type ProfileData = {
  username: string | null;
  university: string | null;
  study_year: number | null;
  bio: string | null;
  skills: string[] | null;
  user_type: string | null;
  created_at: string | null;
  cv_url: string | null;
  linkedin_url: string | null;
  verified: boolean | null;
  phone_number: string | null;
  company_name: string | null;
  company_description: string | null;
  avatar_url: string | null;
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
  const [editLinkedinUrl, setEditLinkedinUrl] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editCompanyDescription, setEditCompanyDescription] = useState("");
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [viewingAvatar, setViewingAvatar] = useState(false);
  const [ratingCount, setRatingCount] = useState(0);
  const [workHistory, setWorkHistory] = useState<
    { id: string; title: string; posted_by: string | null; closed_at: string }[]
  >([]);
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const t = useTranslation();
  const { marketplaceMode, setMarketplaceMode } = useMarketplaceMode();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
            "username, university, study_year, bio, skills, user_type, created_at, cv_url, linkedin_url, verified, phone_number, avatar_url",
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

    // Work history: jobs where this user's offer was accepted (as student)
    const { data: acceptedOffers } = await supabase
      .from("offers")
      .select("id, requests(id, title, created_at, profiles(username))")
      .eq("seller_id", user.id)
      .eq("status", "accepted");
    if (acceptedOffers) {
      setWorkHistory(
        (acceptedOffers as any[]).map((o) => ({
          id: o.id,
          title: o.requests?.title ?? "Untitled",
          posted_by: o.requests?.profiles?.username ?? null,
          closed_at: o.requests?.created_at ?? "",
        })),
      );
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
    setEditLinkedinUrl(profile.linkedin_url ?? "");
    setEditPhoneNumber(profile.phone_number ?? "");
    setEditCompanyName(profile.company_name ?? "");
    setEditCompanyDescription(profile.company_description ?? "");
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
        linkedin_url: editLinkedinUrl.trim() || null,
        phone_number: editPhoneNumber.trim() || null,
        company_name: editCompanyName.trim() || null,
        company_description: editCompanyDescription.trim() || null,
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

  async function pickAndUploadAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission needed");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    try {
      setUploadingAvatar(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const asset = result.assets[0];
      const uri = asset.uri;

      // safer extension handling
      const fileExt = asset.mimeType?.split("/")[1] ?? "jpg";
      const filePath = `${user.id}/avatar.${fileExt}`;

      // convert image to arrayBuffer
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, arrayBuffer, {
          contentType: asset.mimeType ?? "image/jpeg",
          upsert: true,
        });

      if (error) {
        console.log(error);
        Alert.alert("Upload failed");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      setProfile((p) => (p ? { ...p, avatar_url: avatarUrl } : p));
    } catch (err) {
      console.log(err);
      Alert.alert("Error uploading avatar");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function openUrl(url: string) {
    const safe =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
    Linking.openURL(safe).catch(() => Alert.alert(t("error"), t("invalidUrl")));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/welcome");
  }

  async function handleVerify() {
    Alert.alert(t("verifyIdentity"), t("verifyMockMsg"), [
      {
        text: t("ok"),
        onPress: async () => {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;
          await supabase
            .from("profiles")
            .update({ verified: true })
            .eq("id", user.id);
          setProfile((p) => (p ? { ...p, verified: true } : p));
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.page}>
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.page} contentContainerStyle={styles.scroll}>
        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarPressable}>
            <Pressable
              style={styles.avatar}
              onPress={() =>
                profile?.avatar_url
                  ? setViewingAvatar(true)
                  : pickAndUploadAvatar()
              }
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={{ width: 104, height: 104, borderRadius: 32 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarInitial}>
                  {(profile?.username ?? email ?? "?")[0].toUpperCase()}
                </Text>
              )}
            </Pressable>
            <Pressable
              style={styles.avatarCameraBtn}
              onPress={pickAndUploadAvatar}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="camera" size={13} color="#fff" />
              )}
            </Pressable>
          </View>
          <Text style={styles.name}>{profile?.username ?? t("anonymous")}</Text>
          {email ? <Text style={styles.email}>{email}</Text> : null}
          <View style={styles.badgesRow}>
            {profile?.user_type ? (
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor:
                      profile.user_type === "employer"
                        ? colors.employerLight
                        : colors.primaryLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeBadgeText,
                    {
                      color:
                        profile.user_type === "employer"
                          ? colors.employer
                          : colors.primary,
                    },
                  ]}
                >
                  {t(profile.user_type)}
                </Text>
              </View>
            ) : null}
            {profile?.verified ? (
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={12} color="#0D9488" />
                <Text style={styles.verifiedText}>{t("verified")}</Text>
              </View>
            ) : !editing ? (
              <Pressable style={styles.verifyBtn} onPress={handleVerify}>
                <Feather name="shield" size={13} color="#7C3AED" />
                <Text style={styles.verifyBtnText}>{t("verifyIdentity")}</Text>
              </Pressable>
            ) : null}
          </View>
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
              placeholderTextColor={colors.mutedText}
            />

            <Text style={styles.fieldLabel}>{t("bio")}</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldTextarea]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Introduce yourself…"
              placeholderTextColor={colors.mutedText}
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
              placeholderTextColor={colors.mutedText}
            />

            <Text style={styles.fieldLabel}>{t("studyYear")}</Text>
            <TextInput
              style={styles.fieldInput}
              value={editStudyYear}
              onChangeText={setEditStudyYear}
              placeholder="1 – 6"
              placeholderTextColor={colors.mutedText}
              keyboardType="number-pad"
              maxLength={1}
            />

            <Text style={styles.fieldLabel}>{t("skills")}</Text>
            <TextInput
              style={styles.fieldInput}
              value={editSkillsRaw}
              onChangeText={setEditSkillsRaw}
              placeholder="React, Design, Excel…"
              placeholderTextColor={colors.mutedText}
            />
            <Text style={styles.fieldHint}>Separate skills with commas</Text>

            <Text style={styles.fieldLabel}>{t("linkedinUrl")}</Text>
            <TextInput
              style={styles.fieldInput}
              value={editLinkedinUrl}
              onChangeText={setEditLinkedinUrl}
              placeholder={t("cvLinkPlaceholder")}
              placeholderTextColor={colors.mutedText}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={styles.fieldLabel}>{t("phone")}</Text>
            <TextInput
              style={styles.fieldInput}
              value={editPhoneNumber}
              onChangeText={setEditPhoneNumber}
              placeholder={t("phonePlaceholder")}
              placeholderTextColor={colors.mutedText}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />

            {(profile?.user_type === "employer" ||
              profile?.user_type === "both") && (
              <>
                <Text style={styles.fieldLabel}>{t("companyName")}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editCompanyName}
                  onChangeText={setEditCompanyName}
                  placeholder={t("companyNamePlaceholder")}
                  placeholderTextColor={colors.mutedText}
                />

                <Text style={styles.fieldLabel}>{t("companyDescription")}</Text>
                <TextInput
                  style={[styles.fieldInput, styles.fieldTextarea]}
                  value={editCompanyDescription}
                  onChangeText={setEditCompanyDescription}
                  placeholder={t("companyDescriptionPlaceholder")}
                  placeholderTextColor={colors.mutedText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </>
            )}

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
                <Text style={styles.saveBtnText}>
                  {saving ? "…" : t("save")}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* ── View mode ── */
          <>
            {/* Bio */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Feather name="user" size={14} color={colors.primary} />
                <Text style={styles.sectionTitle}>{t("about")}</Text>
              </View>
              {profile?.bio ? (
                <Text style={styles.bioText}>{profile.bio}</Text>
              ) : (
                <Pressable onPress={startEditing}>
                  <Text style={styles.emptyHint}>{t("addBioHint")}</Text>
                </Pressable>
              )}
            </View>

            {/* Education */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Feather name="book" size={14} color={colors.primary} />
                <Text style={styles.sectionTitle}>{t("education")}</Text>
              </View>
              {profile?.university || profile?.study_year ? (
                <>
                  {profile.university ? (
                    <View style={styles.infoRow}>
                      <Feather
                        name="book"
                        size={14}
                        color={colors.secondaryText}
                      />
                      <Text style={styles.infoText}>{profile.university}</Text>
                    </View>
                  ) : null}
                  {profile.study_year ? (
                    <View style={styles.infoRow}>
                      <Feather
                        name="calendar"
                        size={14}
                        color={colors.secondaryText}
                      />
                      <Text style={styles.infoText}>
                        {t("year")} {profile.study_year}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <Pressable onPress={startEditing}>
                  <Text style={styles.emptyHint}>{t("addEducationHint")}</Text>
                </Pressable>
              )}
            </View>

            {/* Skills */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Feather name="zap" size={14} color={colors.primary} />
                <Text style={styles.sectionTitle}>{t("skills")}</Text>
              </View>
              {profile?.skills && profile.skills.length > 0 ? (
                <View style={styles.skillsRow}>
                  {profile.skills.map((s, i) => (
                    <View key={i} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{s}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Pressable onPress={startEditing}>
                  <Text style={styles.emptyHint}>{t("addSkillsHint")}</Text>
                </Pressable>
              )}
            </View>

            {/* Contact */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Feather name="at-sign" size={14} color={colors.primary} />
                <Text style={styles.sectionTitle}>{t("contact")}</Text>
              </View>
              {/* LinkedIn */}
              <View style={styles.contactRow}>
                <View style={styles.contactLabel}>
                  <Feather name="link-2" size={13} color="#0A66C2" />
                  <Text style={styles.contactLabelText}>LinkedIn</Text>
                </View>
                {profile?.linkedin_url ? (
                  <Pressable
                    style={styles.contactValue}
                    onPress={() => openUrl(profile.linkedin_url!)}
                  >
                    <Text style={styles.contactLinkText} numberOfLines={1}>
                      {profile.linkedin_url}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={startEditing}>
                    <Text style={styles.contactEmpty}>{t("add")}</Text>
                  </Pressable>
                )}
              </View>
              {/* Phone */}
              <View style={[styles.contactRow, { borderBottomWidth: 0 }]}>
                <View style={styles.contactLabel}>
                  <Feather name="phone" size={13} color={colors.primary} />
                  <Text style={styles.contactLabelText}>{t("phone")}</Text>
                </View>
                {profile?.phone_number ? (
                  <Pressable
                    style={styles.contactValue}
                    onPress={() =>
                      Linking.openURL(`tel:${profile.phone_number}`)
                    }
                  >
                    <Text style={styles.contactLinkText} numberOfLines={1}>
                      {profile.phone_number}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={startEditing}>
                    <Text style={styles.contactEmpty}>{t("add")}</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Company (employer/both only) */}
            {(profile?.user_type === "employer" ||
              profile?.user_type === "both") &&
            (profile?.company_name || profile?.company_description) ? (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Feather name="briefcase" size={14} color={colors.employer} />
                  <Text style={styles.sectionTitle}>{t("companySection")}</Text>
                </View>
                {profile.company_name ? (
                  <Text
                    style={[
                      styles.infoText,
                      { color: colors.primaryText, fontWeight: "700" },
                    ]}
                  >
                    {profile.company_name}
                  </Text>
                ) : null}
                {profile.company_description ? (
                  <Text
                    style={[
                      styles.bioText,
                      { marginTop: profile.company_name ? 4 : 0 },
                    ]}
                  >
                    {profile.company_description}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings")}</Text>

          {!editing && (
            <Pressable style={styles.settingRow} onPress={startEditing}>
              <View style={styles.settingLeft}>
                <Feather name="edit-2" size={14} color={colors.primary} />
                <Text style={[styles.settingLabel, { color: colors.primary }]}>
                  {t("editProfile")}
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={14}
                color={colors.mutedText}
              />
            </Pressable>
          )}

          {/* Marketplace mode */}
          <View style={styles.modeSection}>
            <View style={styles.modeHeaderRow}>
              <Feather name="filter" size={14} color={colors.secondaryText} />
              <Text style={styles.settingLabel}>{t("marketplaceMode")}</Text>
            </View>
            <Text style={styles.settingSubLabel}>
              {marketplaceMode === "employer"
                ? t("employerMode")
                : marketplaceMode === "student"
                  ? t("studentMode")
                  : t("allModeDesc")}
            </Text>
            <View style={styles.modeTrack}>
              {(
                [
                  { key: "all", icon: "layers", label: t("all") },
                  {
                    key: "employer",
                    icon: "briefcase",
                    label: t("filterHiring"),
                  },
                  { key: "student", icon: "user", label: t("filterOffering") },
                ] as const
              ).map(({ key, icon, label }) => {
                const active = marketplaceMode === key;
                return (
                  <Pressable
                    key={key}
                    style={[
                      styles.modeOption,
                      active && styles.modeOptionActive,
                      active &&
                        key === "employer" &&
                        styles.modeOptionEmployerActive,
                      active &&
                        key === "student" &&
                        styles.modeOptionStudentActive,
                    ]}
                    onPress={() => setMarketplaceMode(key)}
                  >
                    <Feather
                      name={icon}
                      size={13}
                      color={
                        !active
                          ? colors.mutedText
                          : key === "employer"
                            ? colors.employer
                            : key === "student"
                              ? colors.primary
                              : colors.primaryText
                      }
                    />
                    <Text
                      style={[
                        styles.modeOptionText,
                        active && styles.modeOptionTextActive,
                        active &&
                          key === "employer" &&
                          styles.modeOptionTextEmployer,
                        active &&
                          key === "student" &&
                          styles.modeOptionTextStudent,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Language */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Feather name="globe" size={16} color={colors.secondaryText} />
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
              <Feather
                name="dollar-sign"
                size={16}
                color={colors.secondaryText}
              />
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
          {/* Dark Mode */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Feather name="moon" size={16} color={colors.secondaryText} />
              <Text style={styles.settingLabel}>{t("darkMode")}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        {/* Work History */}
        {workHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Feather name="briefcase" size={14} color={colors.primary} />
              <Text style={styles.sectionTitle}>{t("workHistory")}</Text>
            </View>
            {workHistory.map((job, idx) => (
              <View
                key={job.id}
                style={[
                  styles.workHistoryItem,
                  idx === workHistory.length - 1 && {
                    borderBottomWidth: 0,
                  },
                ]}
              >
                <Feather name="check-circle" size={14} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.workHistoryTitle}>{job.title}</Text>
                  {job.posted_by ? (
                    <Text style={styles.workHistoryMeta}>
                      {t("postedBy")} {job.posted_by}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Sign Out */}
        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <Feather name="log-out" size={16} color={colors.error} />
          <Text style={styles.signOutText}>{t("signOut")}</Text>
        </Pressable>
      </ScrollView>

      {profile?.avatar_url && (
        <ImageViewer
          images={[profile.avatar_url]}
          visible={viewingAvatar}
          onClose={() => setViewingAvatar(false)}
        />
      )}
    </>
  );
}
