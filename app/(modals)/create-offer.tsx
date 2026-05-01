import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../src/context/LanguageContext";
import { requireAuth } from "../../src/lib/authGuard";
import { supabase } from "../../src/lib/supabase";
import { styles, theme } from "./create-offer.styles";

export default function ApplyModal() {
  const t = useTranslation();
  const { requestId, title } = useLocalSearchParams<{ requestId: string; title?: string }>();
  const [coverLetter, setCoverLetter] = useState("");
  const [saving, setSaving] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    requireAuth();
    checkExisting();
  }, []);

  async function checkExisting() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !requestId) return;
    const { data } = await supabase
      .from("offers")
      .select("id")
      .eq("request_id", requestId)
      .eq("seller_id", user.id)
      .neq("status", "withdrawn")
      .maybeSingle();
    setAlreadyApplied(!!data);
  }

  async function handleApply() {
    if (!coverLetter.trim()) {
      Alert.alert(t("error"), t("coverLetterRequired"));
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/sign-in"); return; }

    const { error } = await supabase.from("offers").insert({
      request_id: requestId,
      seller_id: user.id,
      price: null,
      cover_letter: coverLetter.trim(),
      status: "pending",
    });

    setSaving(false);
    if (error) {
      Alert.alert(t("error"), error.message);
    } else {
      Alert.alert(t("applicationSent"), t("applicationSentDesc"), [
        { text: t("ok"), onPress: () => router.back() },
      ]);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Feather name="x" size={22} color={theme.primaryText} />
          </Pressable>
          <Text style={styles.headerTitle}>{t("applyForJob")}</Text>
          <View style={{ width: 38 }} />
        </View>

        {title ? (
          <View style={styles.jobTitleBox}>
            <Text style={styles.jobTitleLabel}>{t("applyingFor")}</Text>
            <Text style={styles.jobTitle} numberOfLines={2}>{title}</Text>
          </View>
        ) : null}

        <View style={styles.body}>
          {alreadyApplied ? (
            <View style={styles.alreadyApplied}>
              <Feather name="check-circle" size={20} color={theme.primary} />
              <Text style={styles.alreadyAppliedText}>{t("alreadyApplied")}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>{t("coverLetter")} *</Text>
              <TextInput
                style={styles.coverInput}
                value={coverLetter}
                onChangeText={setCoverLetter}
                placeholder={t("coverLetterPlaceholder")}
                placeholderTextColor={theme.mutedText}
                multiline
                numberOfLines={6}
                maxLength={600}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{coverLetter.length}/600</Text>
              <Pressable
                style={[styles.submitBtn, saving && { opacity: 0.6 }]}
                onPress={handleApply}
                disabled={saving}
              >
                <Text style={styles.submitBtnText}>
                  {saving ? t("sending") : t("sendApplication")}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
