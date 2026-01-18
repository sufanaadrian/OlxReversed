import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Screen } from "../../../src/components/Screen";
import { supabase } from "../../../src/lib/supabase";

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = Math.min(120, width * 0.28);

type OfferRow = {
  id: string;
  user_id: string; // seller
  price: number;
  description: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

export default function OfferSwipeScreen() {
  const { id: requestId } = useLocalSearchParams<{ id: string }>();

  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const load = useCallback(async () => {
    if (!requestId) return;

    setLoading(true);

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;

    if (!user) {
      setLoading(false);
      return;
    }

    // 1) Verify request ownership
    const { data: request, error: reqError } = await supabase
      .from("requests")
      .select("id,user_id,status")
      .eq("id", requestId)
      .single();

    if (reqError || !request || request.user_id !== user.id) {
      setIsOwner(false);
      setLoading(false);
      return;
    }

    setIsOwner(true);

    // 2) Fetch pending offers
    const { data: offerRows } = await supabase
      .from("offers")
      .select("id,user_id,price,description,status,created_at")
      .eq("request_id", requestId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    setOffers((offerRows ?? []) as OfferRow[]);
    setIndex(0);
    setLoading(false);
  }, [requestId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const currentOffer = offers[index];

  const resetCard = () => {
    translate.setValue({ x: 0, y: 0 });
  };

  const acceptOffer = async (offer: OfferRow) => {
    // accept selected offer
    await supabase
      .from("offers")
      .update({ status: "accepted" })
      .eq("id", offer.id);

    // reject all other offers
    await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("request_id", requestId)
      .neq("id", offer.id);

    // close request
    await supabase
      .from("requests")
      .update({ status: "matched" }) // <-- new status
      .eq("id", requestId);

    router.back();
  };

  const rejectOffer = async (offer: OfferRow) => {
    await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("id", offer.id);

    setIndex((prev) => prev + 1);
    resetCard();
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentOffer) return;
    if (direction === "right") acceptOffer(currentOffer);
    else rejectOffer(currentOffer);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6,
        onPanResponderMove: Animated.event(
          [null, { dx: translate.x, dy: translate.y }],
          { useNativeDriver: false },
        ),
        onPanResponderRelease: (_, g) => {
          if (g.dx > SWIPE_THRESHOLD) {
            Animated.timing(translate, {
              toValue: { x: width + 200, y: 0 },
              duration: 180,
              useNativeDriver: false,
            }).start(() => handleSwipe("right"));
            return;
          }

          if (g.dx < -SWIPE_THRESHOLD) {
            Animated.timing(translate, {
              toValue: { x: -width - 200, y: 0 },
              duration: 180,
              useNativeDriver: false,
            }).start(() => handleSwipe("left"));
            return;
          }

          Animated.spring(translate, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        },
      }),
    [currentOffer],
  );

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>Loading offers…</Text>
        </View>
      </Screen>
    );
  }

  if (!isOwner) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>Access denied</Text>
          <Text style={styles.subtitle}>
            Only the request owner can review offers.
          </Text>
        </View>
      </Screen>
    );
  }

  if (!currentOffer) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>No more offers</Text>
          <Text style={styles.subtitle}>
            You have reviewed all available offers.
          </Text>
        </View>
      </Screen>
    );
  }

  const rotate = translate.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ["-10deg", "0deg", "10deg"],
  });

  return (
    <Screen>
      <View style={styles.page}>
        <View style={styles.progress}>
          <Text style={styles.progressText}>
            Offer {index + 1} of {offers.length}
          </Text>
        </View>

        <View style={styles.stack}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.card,
              {
                transform: [{ translateX: translate.x }, { rotate }],
              },
            ]}
          >
            <Text style={styles.price}>
              ${currentOffer.price.toLocaleString()}
            </Text>

            <Text style={styles.desc}>{currentOffer.description}</Text>

            <Text style={styles.meta}>
              Received {new Date(currentOffer.created_at).toLocaleDateString()}
            </Text>
          </Animated.View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.btn} onPress={() => handleSwipe("left")}>
            <Feather name="x" size={22} />
          </Pressable>

          <Pressable style={styles.btn} onPress={() => handleSwipe("right")}>
            <Feather name="check" size={22} />
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const theme = {
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
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  title: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.primaryText,
  },

  subtitle: {
    fontSize: 14,
    color: theme.secondaryText,
    textAlign: "center",
  },

  progress: {
    alignItems: "center",
    marginBottom: 10,
  },

  progressText: {
    fontWeight: "900",
    color: theme.secondaryText,
  },

  stack: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    width: "100%",
    height: "80%",
    backgroundColor: theme.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 18,
    justifyContent: "center",
  },

  price: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 12,
    color: theme.primaryText,
  },

  desc: {
    fontSize: 15,
    color: theme.secondaryText,
    lineHeight: 22,
  },

  meta: {
    marginTop: 12,
    fontSize: 12,
    color: theme.secondaryText,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 14,
  },

  btn: {
    height: 54,
    width: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surface,
  },
});
