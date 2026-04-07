import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Screen } from "../../src/components/Screen";
import { useTranslation } from "../../src/context/LanguageContext";
import { supabase } from "../../src/lib/supabase";
import { styles, theme } from "./create-offer.styles";

type OfferStatus = "pending" | "accepted" | "rejected" | "withdrawn";
type OfferRow = {
  id: string;
  request_id: string;
  user_id: string;
  status: OfferStatus;
  price: number;
  description: string;
  created_at: string;
};

export default function CreateOfferModal() {
  const t = useTranslation();
  const params = useLocalSearchParams();
  const requestId = (params?.requestId as string) ?? "";

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const [latestOffer, setLatestOffer] = useState<OfferRow | null>(null);

  const loadLatestOffer = useCallback(async () => {
    setChecking(true);

    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;

    if (!uid || !requestId) {
      setLatestOffer(null);
      setChecking(false);
      return;
    }

    // Get latest offer for this request made by this user
    const { data, error } = await supabase
      .from("offers")
      .select("id, request_id, user_id, status, price, description, created_at")
      .eq("request_id", requestId)
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.log("loadLatestOffer error:", error);
      setLatestOffer(null);
    } else {
      setLatestOffer((data?.[0] ?? null) as any);
    }

    setChecking(false);
  }, [requestId]);

  useFocusEffect(
    useCallback(() => {
      loadLatestOffer();
    }, [loadLatestOffer]),
  );

  const canSend = useMemo(() => {
    // No offer yet → can send
    if (!latestOffer) return true;

    // Pending exists → cannot send another
    if (latestOffer.status === "pending") return false;

    // Rejected → can send again
    if (latestOffer.status === "rejected") return true;

    // Accepted → usually block (deal already agreed)
    if (latestOffer.status === "accepted") return false;

    return true;
  }, [latestOffer]);

  const disabledReason = useMemo(() => {
    if (!latestOffer) return "";
    if (latestOffer.status === "pending") return t("offerAlreadyPending");
    if (latestOffer.status === "accepted") return t("offerAccepted");
    return "";
  }, [latestOffer, t]);

  const onSubmit = async () => {
    const p = Number(price);

    if (!requestId) {
      Alert.alert(t("error"), t("missingRequestId"));
      return;
    }

    if (!Number.isFinite(p) || p <= 0) {
      Alert.alert(t("invalidPriceTitle"), t("invalidPrice"));
      return;
    }

    if (description.trim().length < 3) {
      Alert.alert(t("invalidDescriptionTitle"), t("invalidDescription"));
      return;
    }

    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;

    if (!uid) {
      Alert.alert(t("signInRequired"), t("pleaseSignIn"));
      router.push("/sign-in" as any);
      return;
    }

    // Block only if latest is pending/accepted
    if (!canSend) {
      Alert.alert(t("offerNotAllowed"), disabledReason || t("cannotSendOffer"));
      return;
    }

    setLoading(true);

    // Insert NEW offer row every time (history)
    const { error } = await supabase.from("offers").insert({
      request_id: requestId,
      user_id: uid,
      price: p,
      description: description.trim(),
      status: "pending",
    });

    setLoading(false);

    if (error) {
      // Unique pending index will throw 23505 if a pending exists
      if ((error as any).code === "23505") {
        Alert.alert(t("offerAlreadyPendingTitle"), t("offerAlreadyPending"));
        loadLatestOffer();
        return;
      }

      Alert.alert(t("error"), error.message);
      return;
    }

    Alert.alert(t("sent"), t("offerSent"));
    router.back();
  };

  return (
    <Screen backgroundColor={theme.bg}>
      <View style={styles.page}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{t("back")}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{t("sendOffer")}</Text>
          <View style={{ width: 56 }} />
        </View>

        {checking ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{t("checkingOffers")}</Text>
          </View>
        ) : latestOffer ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {t("latestOfferStatus")}{" "}
              <Text style={{ fontWeight: "900" }}>
                {latestOffer.status.toUpperCase()}
              </Text>
            </Text>

            {!canSend && (
              <Text style={[styles.infoText, { marginTop: 6 }]}>
                {disabledReason}
              </Text>
            )}

            {latestOffer.status === "rejected" && (
              <Text style={[styles.infoText, { marginTop: 6 }]}>
                {t("lastOfferRejected")}
              </Text>
            )}
          </View>
        ) : null}

        <Text style={styles.label}>{t("price")}</Text>
        <TextInput
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          placeholder={t("examplePrice")}
          placeholderTextColor={theme.secondaryText}
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>
          {t("description")}
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t("shortMessagePlaceholder")}
          placeholderTextColor={theme.secondaryText}
          style={[styles.input, styles.textArea]}
          multiline
        />

        <Pressable
          onPress={onSubmit}
          style={({ pressed }) => [
            styles.cta,
            (!canSend || loading) && styles.ctaDisabled,
            pressed && { opacity: 0.9 },
          ]}
          disabled={!canSend || loading}
        >
          <Text style={styles.ctaText}>
            {loading ? t("sending") : t("sendOffer")}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
