import { router } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { Screen } from "../src/components/Screen";
import { useTranslation } from "../src/context/LanguageContext";
import { supabase } from "../src/lib/supabase";
import { styles } from "./sign-up.styles";

type AccountType = "individual" | "business";
type Intent = "buyer" | "seller" | "both";

const RO_PHONE_REGEX = /^(\+40|0)(2\d{8}|3\d{8}|7\d{8})$/;

function cleanPhone(raw: string) {
  return raw.replace(/[\s\-().]/g, "");
}

export default function SignUpScreen() {
  const t = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("+40");
  const [city, setCity] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [intent, setIntent] = useState<Intent>("both");
  const [companyName, setCompanyName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [cui, setCui] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (text: string) => {
    if (!text.startsWith("+40")) {
      setPhone("+40");
    } else {
      setPhone(text);
    }
  };

  const onContinue = async () => {
    setMsg("");
    setIsError(false);

    if (
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !displayName.trim() ||
      !phone.trim() ||
      !city.trim()
    ) {
      setMsg(t("fillAllRequired"));
      setIsError(true);
      return;
    }

    if (password !== confirmPassword) {
      setMsg(t("passwordsDoNotMatch"));
      setIsError(true);
      return;
    }

    const cleaned = cleanPhone(phone.trim());
    if (!RO_PHONE_REGEX.test(cleaned)) {
      setMsg(t("invalidPhone"));
      setIsError(true);
      return;
    }

    setLoading(true);

    // Metadata is passed so the handle_new_user trigger can populate the
    // profile when email confirmation is ON (no session yet).
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName.trim(),
          phone: cleaned,
          city: city.trim(),
          account_type: accountType,
          user_intent: intent,
        },
      },
    });

    setLoading(false);

    if (error) {
      const isAlreadyExists =
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already exists");
      setMsg(isAlreadyExists ? t("userAlreadyRegistered") : error.message);
      setIsError(true);
      return;
    }

    // When email confirmation is OFF a session is returned immediately.
    // Write the profile client-side — this is the reliable primary path.
    if (data.session && data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          display_name: displayName.trim(),
          phone: cleaned,
          city: city.trim(),
          account_type: accountType,
          intent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (profileError) {
        console.warn("[sign-up] profile upsert failed:", profileError.message);
      }

      // Save business details if applicable
      if (accountType === "business" && companyName.trim()) {
        const { error: bizError } = await supabase
          .from("business_details")
          .upsert(
            {
              user_id: data.user.id,
              company_name: companyName.trim(),
              vat_number: vatNumber.trim() || null,
              cui: cui.trim() || null,
              address: companyAddress.trim() || null,
            },
            { onConflict: "user_id" },
          );
        if (bizError) {
          console.warn(
            "[sign-up] business_details upsert failed:",
            bizError.message,
          );
        }
      }

      router.replace({
        pathname: "/onboarding" as any,
        params: { accountType },
      });
    } else {
      // Email confirmation ON — trigger handles profile creation via metadata.
      setMsg(t("accountCreatedConfirm"));
      setIsError(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{t("step1of2")}</Text>
          </View>

          <Text style={styles.h1}>{t("createAccount")}</Text>
          <Text style={styles.subtitle}>{t("welcomeMessage")}</Text>

          {/* Email */}
          <Text style={styles.label}>
            {t("emailPlaceholder")} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t("emailPlaceholder")}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {/* Password */}
          <Text style={styles.label}>
            {t("passwordPlaceholder")} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t("passwordPlaceholder")}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Confirm Password */}
          <Text style={styles.label}>
            {t("confirmPasswordPlaceholder")}{" "}
            <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t("confirmPasswordPlaceholder")}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {/* Display name */}
          <Text style={styles.label}>
            {t("displayName")} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t("displayNamePlaceholder")}
            value={displayName}
            onChangeText={setDisplayName}
          />

          {/* Phone */}
          <Text style={styles.label}>
            {t("phone")} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t("phonePlaceholder")}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={handlePhoneChange}
          />

          {/* City */}
          <Text style={styles.label}>
            {t("city")} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t("cityPlaceholder")}
            value={city}
            onChangeText={setCity}
          />

          {/* Account type */}
          <Text style={styles.label}>{t("accountType")}</Text>
          <View style={styles.selectorRow}>
            <Pressable
              style={[
                styles.selectorBtn,
                accountType === "individual" && styles.selectorBtnActive,
              ]}
              onPress={() => setAccountType("individual")}
            >
              <Text
                style={[
                  styles.selectorText,
                  accountType === "individual" && styles.selectorTextActive,
                ]}
              >
                {t("individual")}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.selectorBtn,
                accountType === "business" && styles.selectorBtnActive,
              ]}
              onPress={() => setAccountType("business")}
            >
              <Text
                style={[
                  styles.selectorText,
                  accountType === "business" && styles.selectorTextActive,
                ]}
              >
                {t("business")}
              </Text>
            </Pressable>
          </View>

          {/* Business details — shown inline when "business" is selected */}
          {accountType === "business" && (
            <View style={styles.businessSection}>
              <Text style={styles.businessSectionTitle}>
                {t("companyDetails")}
              </Text>

              <Text style={styles.label}>
                {t("companyName")} <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t("companyNamePlaceholder")}
                value={companyName}
                onChangeText={setCompanyName}
              />

              <Text style={styles.label}>{t("cuiNumber")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("cuiPlaceholder")}
                value={cui}
                onChangeText={setCui}
                keyboardType="numeric"
              />

              <Text style={styles.label}>{t("vatNumber")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("vatPlaceholder")}
                value={vatNumber}
                onChangeText={setVatNumber}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>{t("companyAddress")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("companyAddressPlaceholder")}
                value={companyAddress}
                onChangeText={setCompanyAddress}
              />
            </View>
          )}

          {/* Intent */}
          <Text style={styles.label}>{t("intent")}</Text>
          <View style={styles.intentRow}>
            {(["buyer", "seller", "both"] as Intent[]).map((opt) => (
              <Pressable
                key={opt}
                style={[
                  styles.intentBtn,
                  intent === opt && styles.intentBtnActive,
                ]}
                onPress={() => setIntent(opt)}
              >
                <Text
                  style={[
                    styles.intentText,
                    intent === opt && styles.intentTextActive,
                  ]}
                >
                  {opt === "buyer"
                    ? t("intentBuy")
                    : opt === "seller"
                      ? t("intentSell")
                      : t("intentBoth")}
                </Text>
              </Pressable>
            ))}
          </View>

          {!!msg && (
            <Text style={isError ? styles.errorMsg : styles.successMsg}>
              {msg}
            </Text>
          )}

          <Pressable
            style={[styles.continueBtn, loading && styles.continueBtnDisabled]}
            onPress={onContinue}
            disabled={loading}
          >
            <Text style={styles.continueBtnText}>
              {loading ? t("working") : t("continueBtn")}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("alreadyHaveAccount")}</Text>
            <Pressable onPress={() => router.replace("/sign-in" as any)}>
              <Text style={styles.footerLink}>{t("signIn")}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
