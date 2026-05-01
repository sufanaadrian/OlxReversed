import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Share,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../../src/context/LanguageContext";
import { supabase } from "../../../src/lib/supabase";
import { styles, theme } from "./index.styles";

type JobDetail = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  location: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  posting_as: string | null;
  created_at: string;
  user_id: string;
  profiles: { username: string | null; verified: boolean | null } | null;
};

type Applicant = {
  id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  profiles: { username: string | null; id: string } | null;
};

const CATEGORY_KEYS: Record<string, string> = {
  Hospitality: "hospitality",
  Retail: "retail",
  Tutoring: "tutoring",
  Events: "events",
  Delivery: "delivery",
  IT: "it",
  Office: "office",
  Marketing: "marketing",
  Other: "other",
};

const OFFER_STATUS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: theme.warningLight,
    text: theme.warning,
    label: "offerPending",
  },
  accepted: {
    bg: theme.successLight,
    text: theme.success,
    label: "offerAccepted",
  },
  rejected: { bg: theme.errorLight, text: theme.error, label: "offerRejected" },
  withdrawn: {
    bg: theme.surfaceAlt,
    text: theme.mutedText,
    label: "offerWithdrawn",
  },
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

export default function JobDetailScreen() {
  const t = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [alreadyReported, setAlreadyReported] = useState(false);

  async function handleShare() {
    if (!job) return;
    await Share.share({
      title: job.title,
      message: `${job.title}\n${job.description ?? ""}\n\nStudentJobs Romania`,
    });
  }

  async function handleToggleSave() {
    if (!userId || !id) return;
    if (isSaved) {
      await supabase
        .from("saved_jobs")
        .delete()
        .eq("user_id", userId)
        .eq("request_id", id);
      setIsSaved(false);
    } else {
      await supabase
        .from("saved_jobs")
        .insert({ user_id: userId, request_id: id });
      setIsSaved(true);
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const { data: jobData } = await supabase
      .from("requests")
      .select(
        "id,title,description,category,location,budget_min,budget_max,status,posting_as,created_at,user_id,profiles(username,verified)",
      )
      .eq("id", id)
      .single();
    setJob(jobData as JobDetail | null);

    // Log this view and get count
    await supabase
      .from("job_views")
      .insert({ request_id: id, viewer_id: user?.id ?? null });
    const { count: vc } = await supabase
      .from("job_views")
      .select("id", { count: "exact", head: true })
      .eq("request_id", id);
    setViewCount(vc ?? 0);

    if (jobData && user) {
      if (jobData.user_id === user.id) {
        const { data: apps } = await supabase
          .from("offers")
          .select(
            "id,status,cover_letter,created_at,profiles!seller_id(id,username)",
          )
          .eq("request_id", id)
          .order("created_at", { ascending: false });
        setApplicants((apps as unknown as Applicant[]) ?? []);
      } else {
        const { data: myApp } = await supabase
          .from("offers")
          .select("id")
          .eq("request_id", id)
          .eq("seller_id", user.id)
          .neq("status", "withdrawn")
          .maybeSingle();
        setHasApplied(!!myApp);
      }
      const { data: savedRow } = await supabase
        .from("saved_jobs")
        .select("id")
        .eq("user_id", user.id)
        .eq("request_id", id)
        .maybeSingle();
      setIsSaved(!!savedRow);

      // Check if already reported
      const { data: reportRow } = await supabase
        .from("reports")
        .select("id")
        .eq("reporter_id", user.id)
        .eq("request_id", id)
        .maybeSingle();
      setAlreadyReported(!!reportRow);
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  async function handleAccept(offerId: string) {
    await supabase
      .from("offers")
      .update({ status: "accepted" })
      .eq("id", offerId);
    await supabase.from("requests").update({ status: "filled" }).eq("id", id);
    fetchData();
  }

  async function handleReject(offerId: string) {
    await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("id", offerId);
    fetchData();
  }

  async function handleClose() {
    Alert.alert(t("closePost"), t("closePostConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("confirm"),
        onPress: async () => {
          await supabase
            .from("requests")
            .update({ status: "closed" })
            .eq("id", id);
          router.back();
        },
      },
    ]);
  }

  async function handleReport() {
    if (!userId) return;
    if (alreadyReported) {
      Alert.alert(t("reportAlready"));
      return;
    }
    Alert.alert(t("reportPost"), t("reportReason"), [
      {
        text: t("reportReasonSpam"),
        onPress: () => submitReport(t("reportReasonSpam")),
      },
      {
        text: t("reportReasonInappropriate"),
        onPress: () => submitReport(t("reportReasonInappropriate")),
      },
      {
        text: t("reportReasonFake"),
        onPress: () => submitReport(t("reportReasonFake")),
      },
      { text: t("cancel"), style: "cancel" },
    ]);
  }

  async function submitReport(reason: string) {
    if (!userId) return;
    const { error } = await supabase
      .from("reports")
      .insert({ reporter_id: userId, request_id: id, reason });
    if (!error) {
      setAlreadyReported(true);
      Alert.alert(t("reportSent"));
    }
  }

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

  if (!job) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Feather name="alert-circle" size={48} color={theme.mutedText} />
          <Text style={styles.notFoundText}>{t("jobNotFound")}</Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>{t("goBack")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = userId === job.user_id;
  const isEmployer = job.posting_as === "employer";
  const wage =
    job.budget_min && job.budget_max
      ? `${job.budget_min}–${job.budget_max} RON/h`
      : job.budget_min
        ? `${job.budget_min}+ RON/h`
        : job.budget_max
          ? `~${job.budget_max} RON/h`
          : null;
  const posterName = job.profiles?.username ?? null;
  const pendingCount = applicants.filter((a) => a.status === "pending").length;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Nav bar */}
      <View style={styles.navbar}>
        <Pressable onPress={() => router.back()} style={styles.navBtn}>
          <Feather name="arrow-left" size={20} color={theme.primaryText} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>
          {job.title}
        </Text>
        <View style={styles.navRight}>
          {userId && !isOwner && (
            <Pressable onPress={handleToggleSave} style={styles.navBtn}>
              <Feather
                name="bookmark"
                size={20}
                color={isSaved ? theme.primary : theme.mutedText}
              />
            </Pressable>
          )}
          <Pressable onPress={handleShare} style={styles.navBtn}>
            <Feather name="share-2" size={20} color={theme.primaryText} />
          </Pressable>
          {userId && !isOwner && (
            <Pressable onPress={handleReport} style={styles.navBtn}>
              <Feather
                name="flag"
                size={18}
                color={alreadyReported ? theme.error : theme.mutedText}
              />
            </Pressable>
          )}
          {isOwner && job.status === "active" ? (
            <Pressable onPress={handleClose} style={styles.navBtn}>
              <Feather name="x-circle" size={20} color={theme.error} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero section */}
        <View style={styles.heroCard}>
          {/* Type + category row */}
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor: isEmployer
                    ? theme.employerLight
                    : theme.primaryLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  {
                    color: isEmployer ? theme.employer : theme.primaryDark,
                  },
                ]}
              >
                {t(job.posting_as ?? "employer")}
              </Text>
            </View>
            {job.category && (
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>
                  {t(CATEGORY_KEYS[job.category] ?? "other")}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    job.status === "active"
                      ? theme.successLight
                      : theme.surfaceAlt,
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      job.status === "active" ? theme.success : theme.mutedText,
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      job.status === "active" ? theme.success : theme.mutedText,
                  },
                ]}
              >
                {t(
                  `status${job.status.charAt(0).toUpperCase() + job.status.slice(1)}`,
                )}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{job.title}</Text>

          {/* Meta chips */}
          <View style={styles.metaRow}>
            {job.location && (
              <View style={styles.metaChip}>
                <Feather name="map-pin" size={13} color={theme.primary} />
                <Text style={styles.metaText}>{job.location}</Text>
              </View>
            )}
            {wage && (
              <View style={[styles.metaChip, styles.wageChip]}>
                <Feather name="dollar-sign" size={13} color={theme.success} />
                <Text style={[styles.metaText, styles.wageText]}>{wage}</Text>
              </View>
            )}
            <View style={styles.viewChip}>
              <Feather name="eye" size={11} color={theme.mutedText} />
              <Text style={styles.viewChipText}>
                {viewCount} {t("viewCount")}
              </Text>
            </View>
          </View>

          {/* Poster */}
          <View style={styles.posterRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(posterName)}</Text>
            </View>
            <View>
              <Text style={styles.posterName}>
                {posterName ?? t("anonymous")}
              </Text>
              {(job.profiles as any)?.verified && (
                <View style={styles.posterVerified}>
                  <Feather name="check-circle" size={11} color="#0D9488" />
                  <Text style={styles.posterVerifiedText}>{t("verified")}</Text>
                </View>
              )}
              {!(job.profiles as any)?.verified && (
                <Text style={styles.posterLabel}>
                  {t("postedBy").replace("Posted by ", "")}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Description */}
        {job.description ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="file-text" size={16} color={theme.primary} />
              <Text style={styles.sectionTitle}>{t("description")}</Text>
            </View>
            <Text style={styles.descText}>{job.description}</Text>
          </View>
        ) : null}

        {/* Already applied banner */}
        {!isOwner && hasApplied && (
          <View style={styles.appliedBanner}>
            <Feather name="check-circle" size={18} color={theme.primary} />
            <Text style={styles.appliedText}>{t("alreadyApplied")}</Text>
          </View>
        )}

        {/* Applicants (owner view) */}
        {isOwner && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="users" size={16} color={theme.primary} />
              <Text style={styles.sectionTitle}>
                {t("applicants")} ({applicants.length})
              </Text>
              {pendingCount > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>
                    {pendingCount} new
                  </Text>
                </View>
              )}
            </View>

            {applicants.length === 0 ? (
              <View style={styles.emptyApplicants}>
                <Feather name="inbox" size={28} color={theme.mutedText} />
                <Text style={styles.emptyApplicantsText}>
                  {t("noApplicantsYet")}
                </Text>
              </View>
            ) : (
              applicants.map((app) => {
                const s = OFFER_STATUS[app.status] ?? OFFER_STATUS.pending;
                const appName =
                  (app as any).profiles?.username ?? t("anonymous");
                return (
                  <View key={app.id} style={styles.applicantCard}>
                    <View style={styles.applicantHeader}>
                      <View style={styles.applicantAvatar}>
                        <Text style={styles.applicantAvatarText}>
                          {initials(appName)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.applicantName}>{appName}</Text>
                        {app.cover_letter ? (
                          <Text
                            style={styles.coverLetterPreview}
                            numberOfLines={2}
                          >
                            {app.cover_letter}
                          </Text>
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.appStatusBadge,
                          { backgroundColor: s.bg },
                        ]}
                      >
                        <Text style={[styles.appStatusText, { color: s.text }]}>
                          {t(s.label)}
                        </Text>
                      </View>
                    </View>

                    {app.cover_letter && app.cover_letter.length > 80 ? (
                      <Text style={styles.coverLetterFull}>
                        {app.cover_letter}
                      </Text>
                    ) : null}

                    {app.status === "pending" && (
                      <View style={styles.decisionRow}>
                        <Pressable
                          style={styles.rejectBtn}
                          onPress={() => handleReject(app.id)}
                        >
                          <Feather name="x" size={14} color={theme.error} />
                          <Text style={styles.rejectBtnText}>
                            {t("reject")}
                          </Text>
                        </Pressable>
                        <Pressable
                          style={styles.acceptBtn}
                          onPress={() => handleAccept(app.id)}
                        >
                          <Feather name="check" size={14} color="#FFFFFF" />
                          <Text style={styles.acceptBtnText}>
                            {t("accept")}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                    {app.status === "accepted" && (
                      <Pressable
                        style={styles.chatBtn}
                        onPress={() => router.push(`/request/${id}/chat`)}
                      >
                        <Feather
                          name="message-circle"
                          size={15}
                          color="#FFFFFF"
                        />
                        <Text style={styles.chatBtnText}>{t("openChat")}</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: isOwner ? 16 : 100 }} />
      </ScrollView>

      {/* Sticky apply button (non-owner only) */}
      {!isOwner && userId && job.status === "active" && !hasApplied && (
        <View style={styles.stickyFooter}>
          <Pressable
            style={styles.applyBtn}
            onPress={() =>
              router.push({
                pathname: "/(modals)/create-offer",
                params: { requestId: id, title: job.title },
              })
            }
          >
            <Text style={styles.applyBtnText}>{t("apply")}</Text>
            <Feather name="arrow-right" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
