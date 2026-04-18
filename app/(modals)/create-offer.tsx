import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "../../src/components/Screen";
import {
  AvailabilitySlot,
  SlotSelector,
} from "../../src/components/SlotSelector";
import { useTranslation } from "../../src/context/LanguageContext";
import { requireAuth } from "../../src/lib/authGuard";
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

  // Availability slots from the request
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [slotStatuses, setSlotStatuses] = useState<
    Record<string, "available" | "pending" | "booked">
  >({});

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

  const loadAvailability = useCallback(async () => {
    if (!requestId) return;

    const { data: slots, error } = await supabase
      .from("request_availability")
      .select("id,day_of_week,start_time,end_time,is_booked")
      .eq("request_id", requestId)
      .order("day_of_week")
      .order("start_time");

    if (error) {
      console.log("loadAvailability error:", error);
      return;
    }

    setAvailableSlots((slots ?? []) as AvailabilitySlot[]);

    // Determine statuses: check which slots have pending/accepted offers
    const slotIds = (slots ?? []).map((s: any) => s.id);
    if (slotIds.length > 0) {
      const { data: offerSlotRows } = await supabase
        .from("offer_slots")
        .select("availability_id,offer_id")
        .in("availability_id", slotIds);

      const statusMap: Record<string, "available" | "pending" | "booked"> = {};
      for (const s of slots ?? []) {
        statusMap[(s as any).id] = (s as any).is_booked
          ? "booked"
          : "available";
      }

      if (offerSlotRows && offerSlotRows.length > 0) {
        const relatedOfferIds = [
          ...new Set(offerSlotRows.map((os: any) => os.offer_id)),
        ];
        const { data: relatedOffers } = await supabase
          .from("offers")
          .select("id,status")
          .in("id", relatedOfferIds);

        const offerStatusMap = new Map(
          (relatedOffers ?? []).map((o: any) => [o.id, o.status]),
        );

        for (const os of offerSlotRows as any[]) {
          const aid = os.availability_id;
          const offerStatus = offerStatusMap.get(os.offer_id);
          if (offerStatus === "accepted") {
            statusMap[aid] = "booked";
          } else if (offerStatus === "pending" && statusMap[aid] !== "booked") {
            statusMap[aid] = "pending";
          }
        }
      }

      setSlotStatuses(statusMap);
    }
  }, [requestId]);

  useFocusEffect(
    useCallback(() => {
      loadLatestOffer();
      loadAvailability();
    }, [loadLatestOffer, loadAvailability]),
  );

  // Pre-populate fields from existing offer (edit mode)
  useEffect(() => {
    if (!latestOffer) return;
    setPrice(String(latestOffer.price));
    setDescription(latestOffer.description ?? "");
  }, [latestOffer]);

  // Load previously selected slots for this offer
  useEffect(() => {
    if (!latestOffer) return;
    const fetchSlots = async () => {
      const { data: slotsRaw } = await supabase
        .from("offer_slots")
        .select("availability_id")
        .eq("offer_id", latestOffer.id);
      if (slotsRaw && slotsRaw.length > 0) {
        setSelectedSlotIds(slotsRaw.map((s: any) => s.availability_id));
      }
    };
    fetchSlots();
  }, [latestOffer]);

  const canSend = useMemo(() => {
    // No offer yet → can send
    if (!latestOffer) return true;

    // Pending exists → can edit (update)
    if (latestOffer.status === "pending") return true;

    // Rejected → can send again
    if (latestOffer.status === "rejected") return true;

    // Accepted → block (deal already agreed)
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

    const guard = await requireAuth();
    if (!guard.ok) return;
    const uid = guard.userId;

    // Block only if latest is pending/accepted
    if (!canSend) {
      Alert.alert(t("offerNotAllowed"), disabledReason || t("cannotSendOffer"));
      return;
    }

    setLoading(true);

    let offerId: string;

    if (latestOffer && latestOffer.status === "pending") {
      // Edit existing pending offer
      const { error } = await supabase
        .from("offers")
        .update({ price: p, description: description.trim() })
        .eq("id", latestOffer.id);

      if (error) {
        setLoading(false);
        Alert.alert(t("error"), error.message);
        return;
      }

      offerId = latestOffer.id;

      // Replace slots: delete old, insert new
      await supabase.from("offer_slots").delete().eq("offer_id", offerId);
      if (selectedSlotIds.length > 0) {
        const { error: slotErr } = await supabase.from("offer_slots").insert(
          selectedSlotIds.map((aid) => ({
            offer_id: offerId,
            availability_id: aid,
          })),
        );
        if (slotErr) console.log("offer_slots update error:", slotErr);
      }

      setLoading(false);
      Alert.alert(t("sent"), t("offerSent"));
      router.back();
      return;
    }

    // Insert NEW offer row every time (history)
    const { data: insertedOffer, error } = await supabase
      .from("offers")
      .insert({
        request_id: requestId,
        user_id: uid,
        price: p,
        description: description.trim(),
        status: "pending",
      })
      .select("id")
      .single();

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

    // Save selected slots
    if (insertedOffer && selectedSlotIds.length > 0) {
      const slotRows = selectedSlotIds.map((aid) => ({
        offer_id: insertedOffer.id,
        availability_id: aid,
      }));
      const { error: slotErr } = await supabase
        .from("offer_slots")
        .insert(slotRows);
      if (slotErr) console.log("offer_slots insert error:", slotErr);
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

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
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

          {availableSlots.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.label}>{t("selectTimeSlots")}</Text>
              <Text style={[styles.infoText, { marginBottom: 8 }]}>
                {t("selectTimeSlotsHint")}
              </Text>
              <SlotSelector
                slots={availableSlots}
                selected={selectedSlotIds}
                onToggle={(id) =>
                  setSelectedSlotIds((prev) =>
                    prev.includes(id)
                      ? prev.filter((x) => x !== id)
                      : [...prev, id],
                  )
                }
                slotStatuses={slotStatuses}
              />
            </View>
          )}

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
              {loading
                ? t("sending")
                : latestOffer?.status === "pending"
                  ? t("editOffer")
                  : t("sendOffer")}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Screen>
  );
}
