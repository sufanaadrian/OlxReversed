import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../src/context/LanguageContext";
import { useTheme } from "../../src/context/ThemeContext";
import { supabase } from "../../src/lib/supabase";
import { makeStyles } from "./[userId].styles";

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
  phone_number: string | null;
  company_name: string | null;
  company_description: string | null;
  avatar_url: string | null;
};

type Endorsement = {
  skill: string;
  count: number;
  endorsedByMe: boolean;
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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useTranslation();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profile, setProfile] = useState<CVProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [canEndorse, setCanEndorse] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, username, bio, university, study_year, skills, user_type, verified, linkedin_url, created_at, phone_number, company_name, company_description, avatar_url",
        )
        .eq("id", userId)
        .single();
      setProfile(data as CVProfile | null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const me = user?.id ?? null;
      setCurrentUserId(me);

      if (me && me !== userId) {
        await loadEndorsements(me);
        await checkCanEndorse(me);
        const { data: savedRow } = await supabase
          .from("saved_candidates")
          .select("student_id")
          .eq("employer_id", me)
          .eq("student_id", userId)
          .maybeSingle();
        setIsSaved(!!savedRow);
      }

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function loadEndorsements(me: string) {
    const { data } = await supabase
      .from("skill_endorsements")
      .select("skill, endorser_id")
      .eq("endorsee_id", userId);
    if (!data) return;
    const map: Record<string, { count: number; endorsedByMe: boolean }> = {};
    for (const row of data) {
      if (!map[row.skill]) map[row.skill] = { count: 0, endorsedByMe: false };
      map[row.skill].count++;
      if (row.endorser_id === me) map[row.skill].endorsedByMe = true;
    }
    setEndorsements(Object.entries(map).map(([skill, v]) => ({ skill, ...v })));
  }

  async function checkCanEndorse(me: string) {
    // Can endorse if there is any hired offer connecting the two users
    const [{ data: myReqs }, { data: theirReqs }] = await Promise.all([
      supabase.from("requests").select("id").eq("user_id", me),
      supabase.from("requests").select("id").eq("user_id", userId),
    ]);
    const myReqIds = (myReqs ?? []).map((r: any) => r.id);
    const theirReqIds = (theirReqs ?? []).map((r: any) => r.id);

    const queries: Promise<any>[] = [];
    if (myReqIds.length) {
      queries.push(
        supabase
          .from("offers")
          .select("id")
          .eq("seller_id", userId)
          .in("request_id", myReqIds)
          .eq("status", "hired")
          .limit(1),
      );
    }
    if (theirReqIds.length) {
      queries.push(
        supabase
          .from("offers")
          .select("id")
          .eq("seller_id", me)
          .in("request_id", theirReqIds)
          .eq("status", "hired")
          .limit(1),
      );
    }
    if (!queries.length) return;
    const results = await Promise.all(queries);
    const found = results.some((r) => (r.data ?? []).length > 0);
    setCanEndorse(found);
  }

  async function handleToggleSave() {
    if (!currentUserId) return;
    if (isSaved) {
      await supabase
        .from("saved_candidates")
        .delete()
        .eq("employer_id", currentUserId)
        .eq("student_id", userId);
      setIsSaved(false);
    } else {
      await supabase
        .from("saved_candidates")
        .insert({ employer_id: currentUserId, student_id: userId });
      setIsSaved(true);
    }
  }

  async function handleInviteToApply() {
    if (!currentUserId) return;
    setSendingInvite(true);
    const { data: jobs } = await supabase
      .from("requests")
      .select("id, title")
      .eq("user_id", currentUserId)
      .eq("status", "active")
      .eq("posting_as", "employer")
      .order("created_at", { ascending: false })
      .limit(8);
    setSendingInvite(false);
    if (!jobs || jobs.length === 0) {
      Alert.alert(t("noActiveJobsForInvite"), t("noActiveJobsForInviteHint"));
      return;
    }
    const jobButtons = jobs.map((j: { id: string; title: string }) => ({
      text: j.title,
      onPress: async () => {
        const { data: existing } = await supabase
          .from("invitations")
          .select("id")
          .eq("employer_id", currentUserId)
          .eq("student_id", userId)
          .eq("request_id", j.id)
          .maybeSingle();
        if (existing) {
          Alert.alert(t("inviteAlreadySent"));
          return;
        }
        await supabase.from("invitations").insert({
          employer_id: currentUserId,
          student_id: userId,
          request_id: j.id,
          status: "pending",
        });
        Alert.alert(t("inviteSent"), t("inviteSentDesc"));
      },
    }));
    Alert.alert(t("inviteToApply"), t("invitePickJob"), [
      ...jobButtons,
      { text: t("cancel"), style: "cancel" as const },
    ]);
  }

  async function handleEndorse(skill: string) {
    if (!currentUserId) return;
    Alert.alert(t("endorseConfirm"), skill, [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("endorseSkill"),
        onPress: async () => {
          const { error } = await supabase.from("skill_endorsements").insert({
            endorser_id: currentUserId,
            endorsee_id: userId,
            skill,
          });
          if (!error) {
            Alert.alert(t("endorseSent"));
            await loadEndorsements(currentUserId);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={colors.primary}
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
  const isViewingOtherStudent =
    currentUserId && currentUserId !== userId && isStudent;
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
          <Feather name="arrow-left" size={20} color={colors.primaryText} />
        </Pressable>
        <Text style={styles.navTitle}>{t("cvScreenTitle")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, isViewingOtherStudent && { paddingBottom: 96 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.avatarWrap}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: 72, height: 72, borderRadius: 36 }}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {initials(profile.username)}
              </Text>
            )}
          </View>
          <Text style={styles.name}>{profile.username ?? t("anonymous")}</Text>
          <View style={styles.badgeRow}>
            {profile.user_type ? (
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor: isStudent
                      ? colors.primaryLight
                      : colors.employerLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeBadgeText,
                    { color: isStudent ? colors.primary : colors.employer },
                  ]}
                >
                  {t(profile.user_type)}
                </Text>
              </View>
            ) : null}
            {profile.verified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={12} color={colors.primary} />
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
              <Feather name="user" size={15} color={colors.primary} />
              <Text style={styles.sectionTitle}>{t("about")}</Text>
            </View>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        ) : null}

        {/* Education */}
        {profile.university || profile.study_year ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="book" size={15} color={colors.primary} />
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
              <Feather name="zap" size={15} color={colors.primary} />
              <Text style={styles.sectionTitle}>{t("skills")}</Text>
            </View>
            <View style={styles.skillsRow}>
              {profile.skills.map((s, i) => {
                const endorsement = endorsements.find((e) => e.skill === s);
                const endorsedByMe = endorsement?.endorsedByMe ?? false;
                const count = endorsement?.count ?? 0;
                return (
                  <View key={i} style={styles.skillChipWrap}>
                    <View style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{s}</Text>
                      {count > 0 && (
                        <View style={styles.endorseBadge}>
                          <Text style={styles.endorseBadgeText}>{count}</Text>
                        </View>
                      )}
                    </View>
                    {canEndorse && !endorsedByMe && (
                      <Pressable
                        style={styles.endorseBtn}
                        onPress={() => handleEndorse(s)}
                      >
                        <Feather
                          name="thumbs-up"
                          size={11}
                          color={colors.primary}
                        />
                        <Text style={styles.endorseBtnText}>
                          {t("endorseSkill")}
                        </Text>
                      </Pressable>
                    )}
                    {endorsedByMe && (
                      <View style={styles.endorsedByMeTag}>
                        <Feather
                          name="check"
                          size={10}
                          color={colors.success}
                        />
                        <Text style={styles.endorsedByMeText}>
                          {t("endorsedByYou")}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Company (employer/both only) */}
        {(profile.user_type === "employer" || profile.user_type === "both") &&
        (profile.company_name || profile.company_description) ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="briefcase" size={15} color={colors.employer} />
              <Text style={styles.sectionTitle}>{t("companySection")}</Text>
            </View>
            {profile.company_name ? (
              <Text style={styles.infoText}>{profile.company_name}</Text>
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

        {/* LinkedIn */}
        {profile.linkedin_url ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="link" size={15} color={colors.primary} />
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
              <Feather name="external-link" size={14} color={colors.info} />
              <Text style={styles.linkedinBtnText}>{t("openLinkedIn")}</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Phone — visible to employers viewing a candidate */}
        {profile.phone_number ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="phone" size={15} color={colors.primary} />
              <Text style={styles.sectionTitle}>{t("phone")}</Text>
            </View>
            <Pressable
              style={styles.linkedinBtn}
              onPress={() => Linking.openURL(`tel:${profile.phone_number}`)}
            >
              <Feather name="phone" size={14} color={colors.info} />
              <Text style={[styles.linkedinBtnText, { color: colors.info }]}>
                {profile.phone_number}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* Employer action bar */}
      {isViewingOtherStudent ? (
        <View style={styles.employerBar}>
          <Pressable
            style={[
              styles.employerBarBtn,
              isSaved && styles.employerBarBtnSaved,
            ]}
            onPress={handleToggleSave}
          >
            <Feather
              name="bookmark"
              size={18}
              color={isSaved ? colors.primary : colors.mutedText}
            />
            <Text
              style={[
                styles.employerBarBtnText,
                isSaved && { color: colors.primary },
              ]}
            >
              {t(isSaved ? "savedCandidate" : "saveCandidate")}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.employerBarBtn, styles.employerBarBtnInvite]}
            onPress={handleInviteToApply}
            disabled={sendingInvite}
          >
            <Feather name="send" size={18} color="#FFFFFF" />
            <Text style={styles.employerBarBtnTextWhite}>
              {t("inviteToApply")}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
