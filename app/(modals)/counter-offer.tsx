import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "../../src/components/Screen";
import { useTranslation } from "../../src/context/LanguageContext";
import { supabase } from "../../src/lib/supabase";

export default function CounterOfferModal() {
  const t = useTranslation();
  const params = useLocalSearchParams();

  const offerId = String(params.offerId ?? "");
  const requestId = String(params.requestId ?? "");
  const sellerId = String(params.sellerId ?? "");
  const sellerEmail = String(params.sellerEmail ?? "seller");

  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const valid = useMemo(() => {
    const p = Number(price);
    return (
      offerId &&
      requestId &&
      sellerId &&
      Number.isFinite(p) &&
      p > 0 &&
      message.trim().length >= 2
    );
  }, [offerId, requestId, sellerId, price, message]);

  const submit = async () => {
    if (!valid) {
      Alert.alert(t("missingInfo"), t("enterValidCounterPrice"));
      return;
    }

    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) {
      Alert.alert(t("signInRequired"), t("pleaseSignInCounterOffer"));
      router.push("/sign-in" as any);
      return;
    }

    setLoading(true);

    // 1) Reject the original offer
    const { error: rejectErr } = await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("id", offerId);

    if (rejectErr) {
      setLoading(false);
      Alert.alert(t("error"), rejectErr.message);
      return;
    }

    // 2) Create counter-offer (requester -> seller)
    const { error: counterErr } = await supabase.from("counter_offers").insert({
      offer_id: offerId,
      request_id: requestId,
      requester_id: uid,
      seller_id: sellerId,
      price: Number(price),
      message: message.trim(),
      status: "pending",
    });

    setLoading(false);

    if (counterErr) {
      Alert.alert(t("error"), counterErr.message);
      return;
    }

    Alert.alert(t("sent"), t("counterOfferSent"));
    router.back();
  };

  return (
    <Screen backgroundColor={theme.bg}>
      <View style={styles.page}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{t("back")}</Text>
          </Pressable>
          <Text style={styles.title}>{t("rejectWithOffer")}</Text>
          <View style={{ width: 56 }} />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{t("rejectingWithCounterPrice")}</Text>
        </View>

        <Text style={styles.label}>{t("yourCounterPrice")}</Text>
        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder={t("exampleCounterPrice")}
          placeholderTextColor={theme.secondaryText}
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>{t("message")}</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={t("exampleCounterMessage")}
          placeholderTextColor={theme.secondaryText}
          style={[styles.input, styles.textArea]}
          multiline
        />

        <Pressable
          onPress={submit}
          disabled={!valid || loading}
          style={({ pressed }) => [
            styles.cta,
            (!valid || loading) && styles.ctaDisabled,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={styles.ctaText}>
            {loading ? t("sending") : t("sendCounterOffer")}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const theme = {
  primary: "#1E40AF",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
};

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontWeight: "900", color: theme.primaryText },
  title: { fontSize: 18, fontWeight: "900", color: theme.primaryText },

  infoBox: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 12,
  },
  infoText: { color: theme.secondaryText, fontWeight: "700", lineHeight: 18 },

  label: { fontWeight: "900", color: theme.primaryText, marginTop: 6 },
  input: {
    height: 46,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    color: theme.primaryText,
  },
  textArea: { height: 110, paddingTop: 12, textAlignVertical: "top" },

  cta: {
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: "white", fontWeight: "900" },
});
