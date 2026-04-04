import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Screen } from "../../src/components/Screen";
import { useTranslation } from "../../src/context/LanguageContext";

export default function FiltersModal() {
  const t = useTranslation();
  return (
    <Screen>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: "900" }}>{t("filters")}</Text>
        <Text>{t("comingSoon")}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ marginTop: 12 }}>{t("close")}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
