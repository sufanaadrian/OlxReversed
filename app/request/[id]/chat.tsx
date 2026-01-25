import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "../../../src/components/Screen";
import { supabase } from "../../../src/lib/supabase";

type RequestStatus = "active" | "matched" | "closed";

type RequestRow = {
  id: string;
  user_id: string;
  title: string;
  status: RequestStatus;
  close_requested_by?: string | null;
  close_confirmed_by?: string | null;
  close_reason?: "completed" | "cancelled" | null;
  closed_at?: string | null;
};

type OfferRow = {
  id: string;
  request_id: string;
  user_id: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  price: number;
  created_at: string;
};

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type MessageRow = {
  id: string;
  offer_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  profiles?: { email: string | null } | null;
};

const theme = {
  primary: "#1E40AF",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
};

const getRequestStatusLabel = (s: RequestStatus) => {
  if (s === "active") return "OPEN";
  if (s === "matched") return "NEGOTIATING";
  return "CLOSED";
};

const formatHM = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = id ?? "";

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [closeWorking, setCloseWorking] = useState(false);

  const [request, setRequest] = useState<RequestRow | null>(null);
  const [acceptedOffer, setAcceptedOffer] = useState<OfferRow | null>(null);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [text, setText] = useState("");
  const [meId, setMeId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<ProfileRow | null>(null);

  const listRef = useRef<FlatList<MessageRow> | null>(null);

  const refreshMeId = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id ?? null;
    setMeId(uid);
    return uid;
  }, []);

  const load = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);

    const uid = await refreshMeId();

    const { data: req, error: reqErr } = await supabase
      .from("requests")
      .select(
        "id,user_id,title,status,close_requested_by,close_confirmed_by,close_reason,closed_at",
      )
      .eq("id", requestId)
      .single();

    if (reqErr || !req) {
      setLoading(false);
      Alert.alert("Not found", "Request not found.");
      router.back();
      return;
    }

    setRequest(req as any);

    // Find the accepted offer for this request (the conversation anchor).
    const { data: off, error: offErr } = await supabase
      .from("offers")
      .select("id,request_id,user_id,status,price,created_at")
      .eq("request_id", requestId)
      .eq("status", "accepted")
      .order("created_at", { ascending: false })
      .limit(1);

    if (offErr) console.log("accepted offer fetch error:", offErr);

    const accepted = (off?.[0] ?? null) as OfferRow | null;
    setAcceptedOffer(accepted);
    // Determine the agreed / final price:
    // - Prefer requests.final_price if you store it
    // - Else, if an accepted counter_offer exists for this offer, use that price
    // - Else fallback to the accepted offer price
    if (accepted) {
      let agreed: number | null = null;

      // 1) request.final_price (if column exists / populated)
      const reqAny: any = req as any;
      if (typeof reqAny?.final_price === "number") {
        agreed = reqAny.final_price;
      } else {
        // 2) accepted counter offer price (if any)
        const { data: accCounters, error: coErr } = await supabase
          .from("counter_offers")
          .select("price,created_at")
          .eq("offer_id", accepted.id)
          .eq("status", "accepted")
          .order("created_at", { ascending: false })
          .limit(1);

        if (coErr) {
          console.log("accepted counter fetch error:", coErr);
        }
        agreed = (accCounters?.[0]?.price ?? null) as any;
      }

      // 3) fallback
      if (agreed == null) agreed = accepted.price;
      setFinalPrice(Number(agreed));
    } else {
      setFinalPrice(null);
    }

    // Fetch the counterpart profile (the person you're negotiating with).
    if (accepted && uid) {
      const otherId =
        uid === (req as any).user_id ? accepted.user_id : (req as any).user_id;
      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("id,name,email,avatar_url")
        .eq("id", otherId)
        .maybeSingle();

      if (!pErr) setOtherUser((prof as any) ?? null);
    } else {
      setOtherUser(null);
    }

    if (!accepted) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const { data: msgs, error: msgErr } = await supabase
      .from("messages")
      .select(
        "id,offer_id,sender_id,text,created_at,profiles!messages_sender_id_fkey ( email )",
      )
      .eq("offer_id", accepted.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (msgErr) {
      console.log("messages fetch error:", msgErr);
      setMessages([]);
      setLoading(false);
      return;
    }

    setMessages((msgs ?? []) as any);
    setLoading(false);

    setTimeout(
      () => listRef.current?.scrollToOffset({ offset: 0, animated: true }),
      30,
    );
  }, [requestId, refreshMeId]);

  // Load on focus
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Realtime: messages (FlatList is inverted; newest at top)
  useEffect(() => {
    const offerId = acceptedOffer?.id;
    if (!offerId) return;

    const channel = supabase
      .channel(`messages:${offerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `offer_id=eq.${offerId}`,
        },
        (payload) => {
          const m = payload.new as MessageRow;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [m, ...prev],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [acceptedOffer?.id]);

  // Realtime: request status / close handshake updates
  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`request:${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "requests",
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          // Keep request in sync across both users instantly
          setRequest(payload.new as any);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  const statusLabel = useMemo(
    () => (request ? getRequestStatusLabel(request.status) : ""),
    [request],
  );

  const canChat = useMemo(() => {
    if (!request) return false;
    if (!acceptedOffer) return false;
    return request.status === "matched" || request.status === "closed";
  }, [request, acceptedOffer]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    if (!acceptedOffer) return;
    if (!canChat) return;

    const uid = await refreshMeId();
    if (!uid) {
      Alert.alert("Sign in required", "Please sign in to chat.");
      router.push("/sign-in" as any);
      return;
    }

    setSending(true);
    try {
      // Optimistic add (instant UI), deduped by realtime.
      const optimistic: MessageRow = {
        id: `optimistic-${Date.now()}`,
        offer_id: acceptedOffer.id,
        sender_id: uid,
        text: t,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [optimistic, ...prev]);
      setText("");
      listRef.current?.scrollToOffset({ offset: 0, animated: true });

      const { error } = await supabase.from("messages").insert({
        offer_id: acceptedOffer.id,
        sender_id: uid,
        text: t,
      });

      if (error) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setText(t);
        Alert.alert("Error", error.message);
        return;
      }
    } finally {
      setSending(false);
    }
  };

  // -------- Close deal handshake --------
  // Rules:
  // - Only in NEGOTIATING (matched)
  // - "Close deal" (completed) or "Cancel" (cancelled) sets close_requested_by + close_reason
  // - Other user can either Confirm (closes request) or Dismiss (clears request)
  // - Requester can Undo their own request (clears request)
  const requestClose = async (reason: "completed" | "cancelled") => {
    if (!request) return;
    if (request.status !== "matched") {
      Alert.alert("Not allowed", "You can close only while NEGOTIATING.");
      return;
    }

    const uid = await refreshMeId();
    if (!uid) {
      Alert.alert("Sign in required", "Please sign in.");
      return;
    }

    // If the other person already requested close → this action becomes CONFIRM.
    if (request.close_requested_by && request.close_requested_by !== uid) {
      await confirmClose();
      return;
    }

    setCloseWorking(true);
    try {
      const { error } = await supabase
        .from("requests")
        .update({
          close_requested_by: uid,
          close_confirmed_by: null,
          close_reason: reason,
          closed_at: null,
        })
        .eq("id", request.id);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      // request realtime will sync; but keep UI snappy
      await load();
    } finally {
      setCloseWorking(false);
    }
  };

  const confirmClose = async () => {
    if (!request) return;
    if (request.status !== "matched") return;

    const uid = await refreshMeId();
    if (!uid) {
      Alert.alert("Sign in required", "Please sign in.");
      return;
    }

    if (!request.close_requested_by || request.close_requested_by === uid) {
      Alert.alert(
        "Waiting",
        "The other person must request closing first (or you can request it).",
      );
      return;
    }

    setCloseWorking(true);
    try {
      const { error } = await supabase
        .from("requests")
        .update({
          close_confirmed_by: uid,
          status: "closed",
          closed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      await load();
    } finally {
      setCloseWorking(false);
    }
  };

  // Initiator can undo their own close request (clears handshake)
  const undoCloseRequest = async () => {
    if (!request) return;

    const uid = await refreshMeId();
    if (!uid) return;
    if (request.close_requested_by !== uid) return;

    setCloseWorking(true);
    try {
      const { error } = await supabase
        .from("requests")
        .update({
          close_requested_by: null,
          close_confirmed_by: null,
          close_reason: null,
          closed_at: null,
        })
        .eq("id", request.id);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
      await load();
    } finally {
      setCloseWorking(false);
    }
  };

  // Non-initiator can dismiss the request (decline closing) → clears handshake so it can be requested again
  const dismissCloseRequest = async () => {
    if (!request) return;

    const uid = await refreshMeId();
    if (!uid) return;

    // Only the other party (not the requester) can dismiss
    if (!request.close_requested_by) return;
    if (request.close_requested_by === uid) return;

    setCloseWorking(true);
    try {
      const { error } = await supabase
        .from("requests")
        .update({
          close_requested_by: null,
          close_confirmed_by: null,
          close_reason: null,
          closed_at: null,
        })
        .eq("id", request.id);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
      await load();
    } finally {
      setCloseWorking(false);
    }
  };

  const closeCTA = useMemo(() => {
    if (!request || request.status !== "matched" || !meId) return null;

    const requestedByMe = request.close_requested_by === meId;
    const requestedByOther =
      !!request.close_requested_by && request.close_requested_by !== meId;

    if (!request.close_requested_by) {
      return (
        <View style={styles.closeRow}>
          <Pressable
            style={[styles.closeBtn, closeWorking && styles.btnDisabled]}
            onPress={() => requestClose("completed")}
            disabled={closeWorking}
          >
            <Text style={styles.closeBtnText}>Close deal</Text>
          </Pressable>

          <Pressable
            style={[
              styles.closeBtn,
              styles.closeBtnGhost,
              closeWorking && styles.btnDisabled,
            ]}
            onPress={() => requestClose("cancelled")}
            disabled={closeWorking}
          >
            <Text style={[styles.closeBtnText, styles.closeBtnTextGhost]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      );
    }

    if (requestedByMe && !request.close_confirmed_by) {
      return (
        <View style={styles.closeRow}>
          <Text style={styles.closeHint}>
            Waiting for confirmation… (
            {(request.close_reason ?? "completed").toUpperCase()})
          </Text>
          <Pressable
            style={[
              styles.closeBtn,
              styles.closeBtnGhost,
              closeWorking && styles.btnDisabled,
            ]}
            onPress={undoCloseRequest}
            disabled={closeWorking}
          >
            <Text style={[styles.closeBtnText, styles.closeBtnTextGhost]}>
              Undo
            </Text>
          </Pressable>
        </View>
      );
    }

    if (requestedByOther && !request.close_confirmed_by) {
      return (
        <View style={styles.closeRow}>
          <Text style={styles.closeHint}>
            Other user requested:{" "}
            {(request.close_reason ?? "completed").toUpperCase()}
          </Text>

          <Pressable
            style={[styles.closeBtn, closeWorking && styles.btnDisabled]}
            onPress={confirmClose}
            disabled={closeWorking}
          >
            <Text style={styles.closeBtnText}>Confirm</Text>
          </Pressable>

          <Pressable
            style={[
              styles.closeBtn,
              styles.closeBtnGhost,
              closeWorking && styles.btnDisabled,
            ]}
            onPress={dismissCloseRequest}
            disabled={closeWorking}
          >
            <Text style={[styles.closeBtnText, styles.closeBtnTextGhost]}>
              Dismiss
            </Text>
          </Pressable>
        </View>
      );
    }

    return null;
  }, [request, meId, closeWorking]);

  const contextBox = useMemo(() => {
    if (!request) return null;

    const showPrice = typeof finalPrice === "number";

    return (
      <View style={styles.contextCard}>
        <View style={styles.contextTopRow}>
          <Text style={styles.contextTitle} numberOfLines={2}>
            {request.title}
          </Text>

          <View
            style={[
              styles.statusPill,
              statusLabel === "OPEN"
                ? styles.pillOpen
                : statusLabel === "NEGOTIATING"
                  ? styles.pillNegotiating
                  : styles.pillClosed,
            ]}
          >
            <Text style={styles.statusPillText}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.contextMetaRow}>
          {showPrice && (
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>
                Agreed • €{Number(finalPrice!).toLocaleString()}
              </Text>
            </View>
          )}

          {request.status === "closed" && (
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>Closed</Text>
            </View>
          )}

          {request.status === "matched" && !!request.close_requested_by && (
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>
                Close requested •{" "}
                {(request.close_reason ?? "completed").toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {closeCTA}
      </View>
    );
  }, [request, acceptedOffer, finalPrice, statusLabel, closeCTA]);

  const renderItem = ({ item }: { item: MessageRow }) => {
    const mine = !!meId && item.sender_id === meId;
    return (
      <View
        style={[styles.msgRow, mine ? styles.msgRowMine : styles.msgRowTheirs]}
      >
        <View
          style={[
            styles.msgBubble,
            mine ? styles.msgBubbleMine : styles.msgBubbleTheirs,
          ]}
        >
          <Text
            style={[
              styles.msgText,
              mine ? styles.msgTextMine : styles.msgTextTheirs,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.msgTime,
              mine ? styles.msgTimeMine : styles.msgTimeTheirs,
            ]}
          >
            {formatHM(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Screen backgroundColor={theme.bg}>
      <View style={styles.page}>
        {/* Header (who you're talking to) */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color={theme.primaryText} />
          </Pressable>

          <View style={styles.avatarWrap}>
            {otherUser?.avatar_url ? (
              <Image
                source={{ uri: otherUser.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {(otherUser?.name || otherUser?.email || "?")
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {otherUser?.name || otherUser?.email || "Chat"}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {request ? getRequestStatusLabel(request.status) : ""}
            </Text>
          </View>

          {request?.status === "closed" ? (
            <View style={styles.headerIconBtn}>
              <Feather name="lock" size={18} color={theme.secondaryText} />
            </View>
          ) : (
            <View style={styles.headerIconBtn}>
              <Feather
                name="message-circle"
                size={18}
                color={theme.secondaryText}
              />
            </View>
          )}
        </View>

        {/* OLX-style request context card */}
        {contextBox}

        {!acceptedOffer ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Chat not available yet</Text>
            <Text style={styles.emptySub}>
              The chat opens once an offer or counter-offer is accepted.
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={(r) => {
                listRef.current = r;
              }}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={renderItem}
              inverted
              contentContainerStyle={{ paddingVertical: 10 }}
              ListEmptyComponent={
                loading ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>Loading…</Text>
                  </View>
                ) : (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>No messages yet</Text>
                    <Text style={styles.emptySub}>Say hi 👋</Text>
                  </View>
                )
              }
            />

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={90}
            >
              <View style={styles.composer}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder={
                    canChat
                      ? "Write a message…"
                      : request?.status === "closed"
                        ? "This deal is closed"
                        : "Chat available only in NEGOTIATING"
                  }
                  placeholderTextColor={theme.secondaryText}
                  style={[styles.input, !canChat && { opacity: 0.6 }]}
                  editable={canChat && !sending}
                  multiline
                />
                <Pressable
                  onPress={send}
                  disabled={!canChat || sending || text.trim().length === 0}
                  style={({ pressed }) => [
                    styles.sendBtn,
                    (!canChat || sending || text.trim().length === 0) &&
                      styles.sendBtnDisabled,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <Feather name="send" size={18} color="#fff" />
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },

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

  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  avatar: { width: "100%", height: "100%" },
  avatarFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: { fontWeight: "900", color: theme.primaryText },

  headerTitle: { fontSize: 16, fontWeight: "900", color: theme.primaryText },
  headerSub: {
    fontSize: 12,
    color: theme.secondaryText,
    fontWeight: "800",
    marginTop: 2,
  },

  headerIconBtn: {
    height: 40,
    width: 40,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },

  contextCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  contextTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  contextTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    color: theme.primaryText,
    lineHeight: 18,
  },

  statusPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillText: { fontSize: 11, fontWeight: "900", color: theme.primaryText },
  pillOpen: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  pillNegotiating: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  pillClosed: { backgroundColor: "#FEE2E2", borderColor: "#FECACA" },

  contextMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  metaPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
  },
  metaPillText: { fontSize: 11, fontWeight: "900", color: theme.primaryText },

  closeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  closeBtn: {
    backgroundColor: theme.primaryText,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  closeBtnText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  closeBtnGhost: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.primaryText,
  },
  closeBtnTextGhost: { color: theme.primaryText },
  closeHint: { color: theme.secondaryText, fontWeight: "800", fontSize: 12 },

  btnDisabled: { opacity: 0.6 },

  emptyBox: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyTitle: { fontWeight: "900", color: theme.primaryText },
  emptySub: {
    color: theme.secondaryText,
    fontWeight: "700",
    textAlign: "center",
  },

  msgRow: { flexDirection: "row", marginVertical: 4 },
  msgRowMine: { justifyContent: "flex-end" },
  msgRowTheirs: { justifyContent: "flex-start" },

  msgBubble: {
    maxWidth: "78%",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  msgBubbleMine: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
    borderTopRightRadius: 6,
  },
  msgBubbleTheirs: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderTopLeftRadius: 6,
  },

  msgText: { fontWeight: "800", lineHeight: 18, fontSize: 14 },
  msgTextMine: { color: "#fff" },
  msgTextTheirs: { color: theme.primaryText },

  msgTime: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "800",
    alignSelf: "flex-end",
  },
  msgTimeMine: { color: "rgba(255,255,255,0.75)" },
  msgTimeTheirs: { color: theme.secondaryText },

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingTop: 10,
    paddingBottom: 14,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.primaryText,
    fontWeight: "800",
  },
  sendBtn: {
    height: 44,
    width: 44,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
});
