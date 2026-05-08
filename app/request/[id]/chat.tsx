import { Feather } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
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
  Linking,
  Modal,
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
import { ImageViewer } from "../../../src/components/ImageViewer";
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
  avatar_url?: string | null;
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [pickerStep, setPickerStep] = useState<"date" | "time">("date");
  const [sendingMedia, setSendingMedia] = useState(false);
  const [viewingMedia, setViewingMedia] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const hasLoaded = useRef(false);
  const messagesRef = useRef<Message[]>([]);

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

  // Keep ref in sync so catchUpMessages can access latest without stale closure
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Silent catch-up: only fetch messages newer than the last one we have (no loading flash)
  const catchUpMessages = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const last = messagesRef.current;
    const lastTs =
      last.length > 0 ? last[last.length - 1].created_at : "1970-01-01";
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at, read_at")
      .eq("request_id", id)
      .gt("created_at", lastTs)
      .order("created_at", { ascending: true });
    if (data && data.length > 0) {
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const newOnes = (data as Message[]).filter((m) => !ids.has(m.id));
        return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
      });
      if (user) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("request_id", id)
          .neq("sender_id", user.id)
          .is("read_at", null);
      }
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
      // Also load current user's name for PDF
      const { data: myProf } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      setMyUsername((myProf as any)?.username ?? null);
      const { data: req } = await supabase
        .from("requests")
        .select(
          "user_id, status, title, category, budget_min, budget_max, location, profiles(id, username, avatar_url)",
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
            "seller_id, price, profiles!seller_id(id, username, phone_number, avatar_url)",
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
          .select("id, username, phone_number, avatar_url")
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
      if (!hasLoaded.current) {
        hasLoaded.current = true;
        fetchMessages();
      } else {
        // Silent catch-up: no flash, only new messages
        catchUpMessages();
      }
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
            const msg = payload.new as Message;
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            // Mark as read immediately if from the other user
            if (userId && msg.sender_id !== userId) {
              supabase
                .from("messages")
                .update({ read_at: new Date().toISOString() })
                .eq("id", msg.id);
            }
          },
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }, [fetchMessages, catchUpMessages, id, userId]),
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

  function parseMediaContent(
    content: string,
  ):
    | { type: "text"; text: string }
    | { type: "img"; url: string }
    | { type: "doc"; name: string; url: string } {
    if (content.startsWith('{"_t":')) {
      try {
        const obj = JSON.parse(content);
        if (obj._t === "img" && obj.url) return { type: "img", url: obj.url };
        if (obj._t === "doc" && obj.url && obj.name)
          return { type: "doc", name: obj.name, url: obj.url };
      } catch {}
    }
    return { type: "text", text: content };
  }

  async function pickAndSendMedia() {
    Alert.alert(t("attachment"), undefined, [
      { text: t("cancel"), style: "cancel" },
      { text: t("sendPhoto"), onPress: pickAndSendImage },
      { text: t("sendFile"), onPress: pickAndSendDocument },
    ]);
  }

  async function pickAndSendImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("permissionNeeded"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.85,
    });
    if (result.canceled || !userId) return;
    setSendingMedia(true);
    try {
      const asset = result.assets[0];
      const ext = asset.mimeType?.split("/")[1] ?? "jpg";
      const filePath = `${id}/${Date.now()}.${ext}`;
      const resp = await fetch(asset.uri);
      const buf = await resp.arrayBuffer();
      const { error } = await supabase.storage
        .from("chat-media")
        .upload(filePath, buf, {
          contentType: asset.mimeType ?? "image/jpeg",
        });
      if (error) {
        Alert.alert(t("mediaUploadFailed"));
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-media").getPublicUrl(filePath);
      await supabase.from("messages").insert({
        request_id: id,
        sender_id: userId,
        content: JSON.stringify({ _t: "img", url: publicUrl }),
      });
    } catch {
      Alert.alert(t("mediaUploadFailed"));
    } finally {
      setSendingMedia(false);
    }
  }

  async function pickAndSendDocument() {
    if (!userId) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setSendingMedia(true);
      const asset = result.assets[0];
      const filePath = `${id}/${Date.now()}_${asset.name}`;
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: "base64" as any,
      });
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const { error } = await supabase.storage
        .from("chat-media")
        .upload(filePath, bytes.buffer, {
          contentType: asset.mimeType ?? "application/octet-stream",
        });
      if (error) {
        Alert.alert(t("mediaUploadFailed"));
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-media").getPublicUrl(filePath);
      await supabase.from("messages").insert({
        request_id: id,
        sender_id: userId,
        content: JSON.stringify({
          _t: "doc",
          name: asset.name,
          url: publicUrl,
        }),
      });
    } catch {
      Alert.alert(t("mediaUploadFailed"));
    } finally {
      setSendingMedia(false);
    }
  }

  function openDateProposal() {
    setPickerDate(new Date());
    setPickerStep("date");
    setShowDatePicker(true);
  }

  function sendDateProposal(date: Date) {
    const formatted = date.toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    setText(`${t("proposedStartDate")}: ${formatted}`);
  }

  function handleAndroidDateChange(
    event: DateTimePickerEvent,
    selected?: Date,
  ) {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }
    const chosen = selected ?? pickerDate;
    if (pickerStep === "date") {
      setPickerDate(chosen);
      setPickerStep("time");
    } else {
      setShowDatePicker(false);
      sendDateProposal(chosen);
    }
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

  async function generateAndSharePDF() {
    if (!requestInfo) return;
    const employerName = isOwner
      ? (myUsername ?? t("employer"))
      : (otherUser?.username ?? t("employer"));
    const studentName = isOwner
      ? (otherUser?.username ?? t("student"))
      : (myUsername ?? t("student"));
    const completedOn = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{font-family:-apple-system,Helvetica,sans-serif;margin:0;padding:40px;color:#1a1a1a;font-size:14px}
  .hdr{background:#0D9488;color:#fff;padding:24px 40px;margin:-40px -40px 32px}
  .hdr h1{margin:0;font-size:22px;font-weight:900}
  .hdr p{margin:4px 0 0;font-size:12px;opacity:.8}
  .sec-title{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6B7280;font-weight:700;margin:24px 0 10px}
  .row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #F3F4F6}
  .lbl{color:#6B7280}.val{font-weight:700}
  .price-box{background:#F0FDF9;border:2px solid #0D9488;border-radius:12px;padding:20px;text-align:center;margin:24px 0}
  .price{font-size:32px;font-weight:900;color:#0D9488}
  .price-lbl{color:#6B7280;font-size:12px;margin-top:4px}
  .footer{margin-top:40px;text-align:center;font-size:11px;color:#9CA3AF}
</style></head>
<body>
  <div class="hdr"><h1>${t("jobSummaryPDF")}</h1><p>OlxReversed — Student Jobs Marketplace</p></div>
  <div class="sec-title">${t("jobDetails")}</div>
  <div class="row"><span class="lbl">${t("jobTitle")}</span><span class="val">${requestInfo.title}</span></div>
  ${requestInfo.category ? `<div class="row"><span class="lbl">${t("category")}</span><span class="val">${requestInfo.category}</span></div>` : ""}
  ${requestInfo.location ? `<div class="row"><span class="lbl">${t("location")}</span><span class="val">${requestInfo.location}</span></div>` : ""}
  <div class="row"><span class="lbl">${t("completedOn")}</span><span class="val">${completedOn}</span></div>
  <div class="sec-title">${t("parties")}</div>
  <div class="row"><span class="lbl">${t("employer")}</span><span class="val">${employerName}</span></div>
  <div class="row"><span class="lbl">${t("student")}</span><span class="val">${studentName}</span></div>
  ${offerInfo ? `<div class="price-box"><div class="price">${offerInfo.price} RON</div><div class="price-lbl">${t("agreedRate")}</div></div>` : ""}
  <div class="footer">Generated by OlxReversed · ${completedOn} · Job ID: ${id}</div>
</body></html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: t("shareSummary"),
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert(t("error"), "Sharing not available on this device.");
      }
    } catch {
      Alert.alert(t("error"), "Failed to generate PDF.");
    }
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
          Alert.alert(t("jobCompleted"), t("jobSummaryPDFHint"), [
            { text: t("rateLater"), style: "cancel" },
            { text: t("shareSummary"), onPress: generateAndSharePDF },
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
          {otherUser?.id ? (
            <Pressable
              style={styles.headerAvatar}
              onPress={() => router.push(`/cv/${otherUser.id}` as any)}
            >
              {otherUser.avatar_url ? (
                <Image
                  source={{ uri: otherUser.avatar_url }}
                  style={styles.headerAvatarImg}
                />
              ) : (
                <Feather name="user" size={18} color={colors.primaryText} />
              )}
            </Pressable>
          ) : null}
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>
              {otherUser?.username ?? t("chat")}
            </Text>
            {jobClosed && (
              <Text style={styles.headerSub}>{t("statusClosed")}</Text>
            )}
          </View>
          <View style={styles.headerActions}>
            {requestInfo && (
              <Pressable
                style={styles.headerIconBtn}
                onPress={generateAndSharePDF}
              >
                <Feather name="download" size={18} color={colors.primaryText} />
              </Pressable>
            )}
            {otherUser?.id && (
              <Pressable
                style={styles.headerIconBtn}
                onPress={() => router.push(`/cv/${otherUser.id}` as any)}
              >
                <Feather
                  name="file-text"
                  size={18}
                  color={colors.primaryText}
                />
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
        {/* Context card — pinned at top, above messages */}
        <ContextCard />

        <FlatList
          data={[...messages].reverse()}
          keyExtractor={(m) => m.id}
          style={{ flex: 1 }}
          contentContainerStyle={styles.messageList}
          inverted
          renderItem={({ item }) => {
            const isMe = item.sender_id === userId;
            const media = parseMediaContent(item.content);
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
                    media.type !== "text" && styles.bubbleMedia,
                  ]}
                >
                  {media.type === "img" ? (
                    <Pressable onPress={() => setViewingMedia(media.url)}>
                      <Image
                        source={{ uri: media.url }}
                        style={styles.mediaImg}
                        resizeMode="cover"
                      />
                    </Pressable>
                  ) : media.type === "doc" ? (
                    <Pressable
                      style={styles.docMsgRow}
                      onPress={() => Linking.openURL(media.url)}
                    >
                      <Feather
                        name="file-text"
                        size={22}
                        color={isMe ? "#fff" : colors.primary}
                      />
                      <View style={styles.docMsgInfo}>
                        <Text
                          style={[
                            styles.docMsgName,
                            isMe && styles.docMsgNameMe,
                          ]}
                          numberOfLines={2}
                        >
                          {media.name}
                        </Text>
                        <Text
                          style={[
                            styles.docMsgOpen,
                            isMe && styles.docMsgOpenMe,
                          ]}
                        >
                          {t("tapToOpen")}
                        </Text>
                      </View>
                    </Pressable>
                  ) : (
                    <Text
                      style={[
                        styles.msgText,
                        isMe ? styles.msgTextMe : styles.msgTextOther,
                      ]}
                    >
                      {item.content}
                    </Text>
                  )}
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

        {/* Quick-reply templates — always visible */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.templateRow}
          contentContainerStyle={styles.templateRowContent}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={styles.dateProposalChip} onPress={openDateProposal}>
            <Text style={styles.dateProposalChipText}>
              {t("tplProposeDate")}
            </Text>
          </Pressable>
          {[
            t("tplAvailable"),
            t("tplWhenStart"),
            t("tplSoundsGood"),
            t("tplConfirm"),
            t("tplLate"),
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

        {/* Input — always available, even on closed jobs */}
        <View
          style={[
            styles.inputRow,
            { paddingBottom: Math.max(10, insets.bottom) },
          ]}
        >
          <Pressable
            style={styles.attachBtn}
            onPress={pickAndSendMedia}
            disabled={sendingMedia}
          >
            <Feather
              name={sendingMedia ? "loader" : "paperclip"}
              size={20}
              color={sendingMedia ? colors.mutedText : colors.primaryText}
            />
          </Pressable>
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

      {/* Full-screen image viewer */}
      <ImageViewer
        images={viewingMedia ? [viewingMedia] : []}
        visible={!!viewingMedia}
        onClose={() => setViewingMedia(null)}
      />

      {/* Date proposal picker — Android native dialog */}
      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={pickerDate}
          mode={pickerStep}
          display="default"
          onChange={handleAndroidDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Date proposal picker — iOS modal */}
      {Platform.OS === "ios" && (
        <Modal
          transparent
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable
            style={styles.datePickerBackdrop}
            onPress={() => setShowDatePicker(false)}
          />
          <View
            style={[
              styles.datePickerContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <View
              style={[styles.datePickerHeader, { borderColor: colors.border }]}
            >
              <Pressable onPress={() => setShowDatePicker(false)}>
                <Text
                  style={[styles.datePickerCancel, { color: colors.mutedText }]}
                >
                  {t("cancel")}
                </Text>
              </Pressable>
              <Text
                style={[styles.datePickerTitle, { color: colors.primaryText }]}
              >
                {t("datePickerTitle")}
              </Text>
              <Pressable
                onPress={() => {
                  setShowDatePicker(false);
                  sendDateProposal(pickerDate);
                }}
              >
                <Text
                  style={[styles.datePickerConfirm, { color: colors.primary }]}
                >
                  {t("confirm")}
                </Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={pickerDate}
              mode="datetime"
              display="spinner"
              onChange={(_, d) => {
                if (d) setPickerDate(d);
              }}
              minimumDate={new Date()}
              textColor={colors.primaryText}
            />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
