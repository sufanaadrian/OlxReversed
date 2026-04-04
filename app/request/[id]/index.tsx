import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../../src/components/Screen";
import { useCurrency } from "../../../src/context/CurrencyContext";
import { useTranslation } from "../../../src/context/LanguageContext";
import { supabase } from "../../../src/lib/supabase";

type RequestRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  location: string | null;
  status: "active" | "closed";
  created_at: string;
};

export default function RequestDetailScreen() {
  const t = useTranslation();
  const { formatPrice } = useCurrency();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [request, setRequest] = useState<RequestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [hasOffered, setHasOffered] = useState(false);
  const [myOfferId, setMyOfferId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;

    setLoading(true);

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;

    const { data, error } = await supabase
      .from("requests")
      .select(
        "id,user_id,title,description,category,budget_min,budget_max,location,status,created_at",
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      Alert.alert(t("error"), t("requestNotFound"));
      router.back();
      return;
    }
    if (user && data.user_id !== user.id) {
      const { data: existingOffer } = await supabase
        .from("offers")
        .select("id,status")
        .eq("request_id", id)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      setMyOfferId(existingOffer?.id ?? null);
    }

    setRequest(data as RequestRow);
    setIsOwner(!!user && data.user_id === user.id);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const deleteRequest = async () => {
    if (!request) return;

    Alert.alert(t("deleteRequest"), t("deleteConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          await supabase.from("requests").delete().eq("id", request.id);

          router.back();
        },
      },
    ]);
  };

  if (loading || !request) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text>{t("loading")}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.page}>
        <Text style={styles.title}>{request.title}</Text>

        <Text style={styles.desc}>{request.description}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {formatPrice(request.budget_min)} –{" "}
            {formatPrice(request.budget_max)}
          </Text>

          {request.location && (
            <Text style={styles.metaText}>{request.location}</Text>
          )}

          <Text style={styles.metaText}>
            {t("posted")} {new Date(request.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* BUYER (OWNER) ACTIONS */}
        {isOwner && (
          <View style={styles.actions}>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push(`/request/${id}/offers`)}
            >
              <Text style={styles.primaryText}>{t("viewOffers")}</Text>
            </Pressable>

            <Pressable style={styles.dangerBtn} onPress={deleteRequest}>
              <Text style={styles.dangerText}>{t("deleteRequest")}</Text>
            </Pressable>
          </View>
        )}

        {/* SELLER (NON-OWNER) ACTION */}
        {!isOwner && request.status === "active" && (
          <View style={styles.actions}>
            {!myOfferId ? (
              <Pressable
                style={styles.primaryBtn}
                onPress={() =>
                  router.push({
                    pathname: "/create-offer",
                    params: { requestId: id },
                  } as any)
                }
              >
                <Text style={styles.primaryText}>{t("sendOffer")}</Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/create-offer",
                      params: { requestId: id, offerId: myOfferId },
                    } as any)
                  }
                >
                  <Text style={styles.primaryText}>{t("editOffer")}</Text>
                </Pressable>

                <Pressable
                  style={styles.dangerBtn}
                  onPress={async () => {
                    await supabase.from("offers").delete().eq("id", myOfferId);
                    setMyOfferId(null);
                  }}
                >
                  <Text style={styles.dangerText}>{t("withdrawOffer")}</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* CLOSED STATE */}
        {request.status === "closed" && (
          <View style={styles.closed}>
            <Feather name="lock" size={18} />
            <Text style={styles.closedText}>{t("requestClosed")}</Text>
          </View>
        )}
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
  danger: "#DC2626",
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 16,
    gap: 14,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.primaryText,
  },

  desc: {
    fontSize: 15,
    color: theme.secondaryText,
    lineHeight: 22,
  },

  meta: {
    gap: 6,
  },

  metaText: {
    fontSize: 14,
    color: theme.secondaryText,
  },

  actions: {
    gap: 10,
    marginTop: 12,
  },

  primaryBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },

  dangerBtn: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.danger,
    alignItems: "center",
    justifyContent: "center",
  },

  dangerText: {
    color: theme.danger,
    fontWeight: "900",
  },

  closed: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  closedText: {
    color: theme.secondaryText,
    fontWeight: "700",
  },
});
