import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "../../src/components/Screen";
import { supabase } from "../../src/lib/supabase";

export default function CreateOfferModal() {
  const { requestId, offerId } = useLocalSearchParams<{
    requestId: string;
    offerId?: string;
  }>();

  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!offerId) return;

    (async () => {
      const { data } = await supabase
        .from("offers")
        .select("price,description")
        .eq("id", offerId)
        .single();

      if (data) {
        setPrice(String(data.price));
        setDescription(data.description);
      }
    })();
  }, [offerId]);

  const submit = async () => {
    if (!price || !description) {
      Alert.alert("Missing fields", "Please fill all fields.");
      return;
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert("Invalid price", "Enter a valid number.");
      return;
    }

    setLoading(true);

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;

    if (!user) {
      setLoading(false);
      return;
    }

    const payload = {
      price: numericPrice,
      description,
    };

    const res = offerId
      ? await supabase.from("offers").update(payload).eq("id", offerId)
      : await supabase.from("offers").insert({
          request_id: requestId,
          user_id: user.id,
          status: "pending",
          ...payload,
        });

    setLoading(false);

    if (res.error) {
      if (res.error.code === "23505") {
        Alert.alert("Offer already sent");
        router.back();
        return;
      }
      Alert.alert("Error", res.error.message);
      return;
    }

    router.back();
  };

  return (
    <Screen>
      <View style={styles.page}>
        <Text style={styles.title}>Send offer</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Price</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="e.g. 1200"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what you’re offering"
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textarea]}
          />
        </View>

        <Pressable
          style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
          onPress={submit}
          disabled={loading}
        >
          <Text style={styles.primaryText}>
            {loading ? "Sending…" : "Send offer"}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
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
  page: {
    flex: 1,
    padding: 16,
    gap: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.primaryText,
  },

  field: {
    gap: 6,
  },

  label: {
    fontWeight: "700",
    color: theme.primaryText,
  },

  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
  },

  textarea: {
    height: 120,
    textAlignVertical: "top",
  },

  primaryBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  primaryText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },

  cancel: {
    textAlign: "center",
    color: theme.secondaryText,
    fontWeight: "700",
  },
});
