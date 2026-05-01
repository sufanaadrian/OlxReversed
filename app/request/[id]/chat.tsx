import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../../src/context/LanguageContext";
import { supabase } from "../../../src/lib/supabase";
import { styles, theme } from "./chat.styles";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type Profile = {
  id: string;
  username: string | null;
};

export default function ChatScreen() {
  const t = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [jobClosed, setJobClosed] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("request_id", id)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) ?? []);
    setLoading(false);
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
        .select("user_id, status, profiles(id, username)")
        .eq("id", id)
        .single();
      if (!req) return;
      const owner = req.user_id === user.id;
      setIsOwner(owner);
      setJobClosed(req.status === "closed" || req.status === "filled");
      if (owner) {
        // I'm the owner, find the accepted applicant
        const { data: offer } = await supabase
          .from("offers")
          .select("seller_id, profiles!seller_id(id, username)")
          .eq("request_id", id)
          .eq("status", "accepted")
          .maybeSingle();
        if (offer) setOtherUser((offer as any).profiles as Profile);
      } else {
        setOtherUser((req as any).profiles as Profile);
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

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={theme.primaryText} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {otherUser?.username ?? t("chat")}
          </Text>
          {jobClosed && (
            <Text style={styles.headerSub}>{t("statusClosed")}</Text>
          )}
        </View>
        {isOwner && !jobClosed && (
          <Pressable onPress={handleComplete} style={styles.completeBtn}>
            <Feather name="check-circle" size={16} color={theme.success} />
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
                <Text style={styles.msgTime}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyWrap}>
                <Feather name="message-circle" size={40} color={theme.border} />
                <Text style={styles.emptyText}>{t("noMessagesYet")}</Text>
              </View>
            ) : null
          }
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={t("typeMessage")}
            placeholderTextColor={theme.mutedText}
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
