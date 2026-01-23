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
import { supabase } from "../../src/lib/supabase";

export default function EditOfferModal() {
  const params = useLocalSearchParams();

  const offerId = (params.offerId as string) ?? "";
  const requestId = (params.requestId as string) ?? "";

  const initialPrice = useMemo(() => Number(params.price ?? 0), [params.price]);
  const initialDesc = useMemo(
    () => String(params.description ?? ""),
    [params.description],
  );

  const [price, setPrice] = useState(String(initialPrice));
  const [description, setDescription] = useState(initialDesc);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!offerId || !requestId) return;

    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) {
      return Alert.alert("Invalid price", "Enter a valid number > 0.");
    }

    setSaving(true);
    try {
      // Optional: prefix so requester can see it was edited
      const nextDesc = description.trim().startsWith("[EDITED]")
        ? description.trim()
        : `[EDITED] ${description.trim()}`;

      const { error } = await supabase
        .from("offers")
        .update({ price: p, description: nextDesc })
        .eq("id", offerId);

      if (error) return Alert.alert("Error", error.message);

      router.back(); // MyOffers reloads on focus or pull-to-refresh
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.page}>
      <Text style={styles.h1}>Edit Offer</Text>

      <Text style={styles.label}>Price</Text>
      <TextInput
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={styles.input}
        placeholder="Enter price"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={[styles.input, styles.textArea]}
        multiline
        placeholder="Describe your offer"
      />

      <Pressable onPress={save} disabled={saving} style={styles.btnPrimary}>
        <Text style={styles.btnPrimaryText}>
          {saving ? "Saving..." : "Save changes"}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.back()} style={styles.btnSecondary}>
        <Text style={styles.btnSecondaryText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16, backgroundColor: "#F9FAFB" },
  h1: { fontSize: 20, fontWeight: "900", marginBottom: 12, color: "#020617" },
  label: {
    fontWeight: "900",
    marginTop: 12,
    marginBottom: 6,
    color: "#020617",
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: { minHeight: 110, textAlignVertical: "top" },
  btnPrimary: {
    marginTop: 16,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#1E40AF",
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: { color: "white", fontWeight: "900" },
  btnSecondary: {
    marginTop: 10,
    height: 44,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondaryText: { color: "#020617", fontWeight: "900" },
});
