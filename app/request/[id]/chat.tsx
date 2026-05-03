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
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTranslation } from "../../../src/context/LanguageContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { supabase } from "../../../src/lib/supabase";
import { makeStyles } from "./chat.styles";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

type Profile = {
  id: string;
  username: string | null;
};

type RequestInfo = {
  title: string;
  category: string | null;
  budget_min: number | null;
  budget_max: number | null;
  location: string | null;
};

type OfferInfo = {
  price: number;
};

export default function ChatScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [otherPhone, setOtherPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [jobClosed, setJobClosed] = useState(false);
  const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null);
  const [offerInfo, setOfferInfo] = useState<OfferInfo | null>(null);
  const flatRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at, read_at")
      .eq("request_id", id)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) ?? []);
    setLoading(false);

    // Mark incoming messages as read
    if (user) {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("request_id", id)
        .neq("sender_id", user.id)
        .is("read_at", null);
    }
  }, [id]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
    // Fetch other participant + ownership
    async function fetchOther() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: req } = await supabase
        .from("requests")
        .select(
          "user_id, status, title, category, budget_min, budget_max, location, profiles(id, username)",
        )
        .eq("id", id)
        .single();
      if (!req) return;
      const owner = req.user_id === user.id;
      setIsOwner(owner);
      setJobClosed(req.status === "closed");
      setRequestInfo({
        title: (req as any).title,
        category: (req as any).category ?? null,
        budget_min: (req as any).budget_min ?? null,
        budget_max: (req as any).budget_max ?? null,
        location: (req as any).location ?? null,
      });
      if (owner) {
        // I'm the owner, find the accepted or hired applicant
        const { data: offer } = await supabase
          .from("offers")
          .select(
            "seller_id, price, profiles!seller_id(id, username, phone_number)",
          )
          .eq("request_id", id)
          .in("status", ["accepted", "hired"])
          .maybeSingle();
        if (offer) {
          const prof = (offer as any).profiles as Profile & {
            phone_number?: string;
          };
          setOtherUser(prof);
          setOtherPhone(prof?.phone_number ?? null);
          setOfferInfo({ price: (offer as any).price });
        }
      } else {
        const prof = (req as any).profiles as Profile & {
          phone_number?: string;
        };
        // Fetch employer phone separately (profiles join on request owner)
        const { data: empProf } = await supabase
          .from("profiles")
          .select("id, username, phone_number")
          .eq("id", req.user_id)
          .single();
        setOtherUser(prof);
        setOtherPhone((empProf as any)?.phone_number ?? null);
        // Fetch my accepted/hired offer price
        const { data: myOffer } = await supabase
          .from("offers")
          .select("price")
          .eq("request_id", id)
          .eq("seller_id", user.id)
          .in("status", ["accepted", "hired"])
          .maybeSingle();
        if (myOffer) setOfferInfo({ price: (myOffer as any).price });
      }
    }
    fetchOther();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchMessages();
      const channel = supabase
        .channel(`chat-${id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `request_id=eq.${id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          },
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }, [fetchMessages, id]),
  );

  async function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed || !userId) return;
    setText("");
    await supabase.from("messages").insert({
      request_id: id,
      sender_id: userId,
      content: trimmed,
    });
  }

  function promptRating() {
    Alert.alert(
      t("rateExperience"),
      otherUser?.username
        ? `Rate your experience with ${otherUser.username} (1–5)`
        : "Rate your experience (1–5)",
      [
        { text: t("rateLater"), style: "cancel" },
        {
          text: t("rateNow"),
          onPress: () =>
            Alert.prompt(
              t("rateExperience"),
              "Enter a number from 1 to 5",
              async (input) => {
                const rating = parseInt(input ?? "", 10);
                if (!rating || rating < 1 || rating > 5) return;
                if (!userId || !otherUser) return;
                await supabase.from("reviews").insert({
                  reviewer_id: userId,
                  reviewee_id: otherUser.id,
                  request_id: id,
                  rating,
                });
                Alert.alert(t("ratingThanks"));
              },
              "plain-text",
              "",
              "number-pad",
            ),
        },
      ],
    );
  }

  async function handleComplete() {
    Alert.alert(t("markComplete"), t("markCompleteConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("confirm"),
        onPress: async () => {
          await supabase
            .from("requests")
            .update({ status: "closed" })
            .eq("id", id);
          setJobClosed(true);
          Alert.alert(t("jobCompleted"), undefined, [
            { text: t("rateLater"), style: "cancel" },
            { text: t("rateNow"), onPress: promptRating },
          ]);
        },
      },
    ]);
  }

  function formatTime(ts: string) {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatBudget(min: number | null, max: number | null) {
    if (!min && !max) return null;
    if (min && max) return `${min}–${max} RON`;
    if (min) return `${min}+ RON`;
    return `~${max} RON`;
  }

  function ContextCard() {
    if (!requestInfo) return null;
    const budget = formatBudget(requestInfo.budget_min, requestInfo.budget_max);
    return (
      <View style={styles.contextCard}>
        <View style={styles.contextCardBody}>
          <View style={styles.contextCardIcon}>
            <Feather name="briefcase" size={20} color={colors.primary} />
          </View>
          <View style={styles.contextCardInfo}>
            <Text style={styles.contextCardTitle} numberOfLines={2}>
              {requestInfo.title}
            </Text>
            <View style={styles.contextCardChips}>
              {requestInfo.category ? (
                <View style={styles.contextChip}>
                  <Feather name="tag" size={10} color={colors.secondaryText} />
                  <Text style={styles.contextChipText}>
                    {requestInfo.category}
                  </Text>
                </View>
              ) : null}
              {budget ? (
                <View style={styles.contextChip}>
                  <Feather
                    name="dollar-sign"
                    size={10}
                    color={colors.secondaryText}
                  />
                  <Text style={styles.contextChipText}>{budget}</Text>
                </View>
              ) : null}
              {offerInfo && offerInfo.price > 0 ? (
                <View style={[styles.contextChip, styles.contextChipGreen]}>
                  <Feather
                    name="check-circle"
                    size={10}
                    color={colors.success}
                  />
                  <Text
                    style={[
                      styles.contextChipText,
                      styles.contextChipTextGreen,
                    ]}
                  >
                    {t("chatContextOffer")}: {offerInfo.price} RON
                  </Text>
                </View>
              ) : null}
              {requestInfo.location ? (
                <View style={styles.contextChip}>
                  <Feather
                    name="map-pin"
                    size={10}
                    color={colors.secondaryText}
                  />
                  <Text style={styles.contextChipText}>
                    {requestInfo.location}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
        <Pressable
          style={styles.contextCardViewBtn}
          onPress={() => router.push(`/request/${id}` as any)}
        >
          <Text style={styles.contextCardViewBtnText}>{t("viewRequest")}</Text>
          <Feather name="external-link" size={13} color={colors.primary} />
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.primaryText} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>
              {otherUser?.username ?? t("chat")}
            </Text>
            {jobClosed && (
              <Text style={styles.headerSub}>{t("statusClosed")}</Text>
            )}
          </View>
          <View style={styles.headerActions}>
            {otherUser?.id && (
              <Pressable
                style={styles.headerIconBtn}
                onPress={() => router.push(`/cv/${otherUser.id}` as any)}
              >
                <Feather name="user" size={18} color={colors.primaryText} />
              </Pressable>
            )}
            {otherUser && (
              <Pressable
                style={[
                  styles.headerIconBtn,
                  styles.headerCallBtn,
                  !otherPhone && styles.headerCallBtnDisabled,
                ]}
                onPress={() => {
                  if (otherPhone) {
                    Linking.openURL(`tel:${otherPhone}`);
                  } else {
                    Alert.alert(t("noPhoneTitle"), t("noPhoneDesc"));
                  }
                }}
              >
                <Feather name="phone" size={18} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        </View>
        {isOwner && !jobClosed && (
          <Pressable onPress={handleComplete} style={styles.completeBtn}>
            <Feather name="check-circle" size={16} color={colors.success} />
            <Text style={styles.completeBtnText}>{t("markComplete")}</Text>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            flatRef.current?.scrollToEnd({ animated: false })
          }
          ListHeaderComponent={<ContextCard />}
          renderItem={({ item }) => {
            const isMe = item.sender_id === userId;
            return (
              <View
                style={[
                  styles.msgWrap,
                  isMe ? styles.msgWrapMe : styles.msgWrapOther,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isMe ? styles.bubbleMe : styles.bubbleOther,
                  ]}
                >
                  <Text
                    style={[
                      styles.msgText,
                      isMe ? styles.msgTextMe : styles.msgTextOther,
                    ]}
                  >
                    {item.content}
                  </Text>
                </View>
                <View style={styles.msgMeta}>
                  <Text style={styles.msgTime}>
                    {formatTime(item.created_at)}
                  </Text>
                  {isMe && (
                    <Text
                      style={[
                        styles.readTick,
                        item.read_at ? styles.readTickSeen : undefined,
                      ]}
                    >
                      {item.read_at ? t("seen") : "✓"}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyWrap}>
                <Feather
                  name="message-circle"
                  size={40}
                  color={colors.border}
                />
                <Text style={styles.emptyText}>{t("noMessagesYet")}</Text>
              </View>
            ) : null
          }
        />

        {/* Quick-reply templates */}
        {!jobClosed && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.templateRow}
            contentContainerStyle={styles.templateRowContent}
            keyboardShouldPersistTaps="handled"
          >
            {[
              t("tplAvailable"),
              t("tplWhenStart"),
              t("tplSoundsGood"),
              t("tplConfirm"),
            ].map((tpl) => (
              <Pressable
                key={tpl}
                style={styles.templateChip}
                onPress={() => setText(tpl)}
              >
                <Text style={styles.templateChipText}>{tpl}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Input */}
        <View
          style={[
            styles.inputRow,
            { paddingBottom: Math.max(10, insets.bottom) },
          ]}
        >
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={t("typeMessage")}
            placeholderTextColor={colors.mutedText}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <Pressable
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!text.trim()}
          >
            <Feather name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
