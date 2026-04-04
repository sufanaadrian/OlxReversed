import { Feather } from "@expo/vector-icons";
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

export default function EditOfferModal() {
  const t = useTranslation();
  const params = useLocalSearchParams();

  const offerId = (params?.offerId as string) ?? "";
  const requestId = (params?.requestId as string) ?? "";

  const initialPrice = useMemo(() => {
    const raw = (params?.price as string) ?? "";
    const n = Number(raw);
    return Number.isFinite(n) ? String(n) : "";
  }, [params?.price]);

  const initialDesc = ((params?.description as string) ?? "").toString();

  const [price, setPrice] = useState(initialPrice);
  const [description, setDescription] = useState(initialDesc);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!offerId) return Alert.alert("Error", "Missing offerId");
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) {
      return Alert.alert("Invalid price", "Please enter a valid price.");
    }

    setSaving(true);
    try {
      // Optional safety: don’t edit withdrawn/accepted (DB should enforce if you want)
      const { data: offerRow, error: fetchErr } = await supabase
        .from("offers")
        .select("id,status")
        .eq("id", offerId)
        .maybeSingle();

      if (fetchErr) return Alert.alert("Error", fetchErr.message);
      if (!offerRow) return Alert.alert("Error", "Offer not found.");

      if (offerRow.status === "accepted") {
        return Alert.alert("Not allowed", "You can't edit an accepted offer.");
      }
      if (offerRow.status === "withdrawn") {
        return Alert.alert("Not allowed", "You can't edit a withdrawn offer.");
      }

      const { data, error } = await supabase
        .from("offers")
        .update({
          price: p,
          description: description.trim(),
        })
        .eq("id", offerId)
        .select("id");

      if (error) return Alert.alert("Error", error.message);
      if (!data || data.length === 0) {
        return Alert.alert(
          "Not updated",
          "No rows were updated (RLS or invalid offer).",
        );
      }

      Alert.alert("Saved", "Your offer was updated.");
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.page}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color={theme.primaryText} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>{t("editOffer")}</Text>
            {!!requestId && (
              <Text style={styles.sub} numberOfLines={1}>
                Request: {requestId}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t("priceLabel")}</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder={t("examplePrice")}
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>
            {t("description")}
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t("updateOfferPlaceholder")}
            style={[styles.input, styles.textArea]}
            multiline
          />

          <Pressable
            onPress={onSave}
            disabled={saving}
            style={[styles.btnPrimary, saving && { opacity: 0.7 }]}
          >
            <Text style={styles.btnPrimaryText}>
              {saving ? t("saving") : t("save")}
            </Text>
          </Pressable>
        </View>
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
  page: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  backBtn: {
    height: 40,
    width: 40,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  h1: { fontSize: 18, fontWeight: "900", color: theme.primaryText },
  sub: { fontSize: 12, color: theme.secondaryText, marginTop: 2 },

  card: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  label: { fontWeight: "900", color: theme.primaryText, fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
    color: theme.primaryText,
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },

  btnPrimary: {
    marginTop: 14,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: { color: "white", fontWeight: "900" },
});
