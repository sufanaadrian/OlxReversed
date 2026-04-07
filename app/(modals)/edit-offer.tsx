import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Screen } from "../../src/components/Screen";
import { useTranslation } from "../../src/context/LanguageContext";
import { supabase } from "../../src/lib/supabase";
import { styles, theme } from "./edit-offer.styles";

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
    if (!offerId) return Alert.alert(t("error"), t("missingOfferId"));
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) {
      return Alert.alert(t("invalidPriceTitle"), t("enterValidPrice"));
    }

    setSaving(true);
    try {
      // Optional safety: don’t edit withdrawn/accepted (DB should enforce if you want)
      const { data: offerRow, error: fetchErr } = await supabase
        .from("offers")
        .select("id,status")
        .eq("id", offerId)
        .maybeSingle();

      if (fetchErr) return Alert.alert(t("error"), fetchErr.message);
      if (!offerRow) return Alert.alert(t("error"), t("offerNotFound"));

      if (offerRow.status === "accepted") {
        return Alert.alert(t("notAllowed"), t("cantEditAcceptedOffer"));
      }
      if (offerRow.status === "withdrawn") {
        return Alert.alert(t("notAllowed"), t("cantEditWithdrawnOffer"));
      }

      const { data, error } = await supabase
        .from("offers")
        .update({
          price: p,
          description: description.trim(),
        })
        .eq("id", offerId)
        .select("id");

      if (error) return Alert.alert(t("error"), error.message);
      if (!data || data.length === 0) {
        return Alert.alert(t("notUpdated"), t("noRowsUpdated"));
      }

      Alert.alert(t("saved"), t("offerUpdated"));
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
                {t("requestLabel")}: {requestId}
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
