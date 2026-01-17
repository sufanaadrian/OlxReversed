import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Screen } from "../../src/components/Screen";

export default function FiltersModal() {
  return (
    <Screen>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: "900" }}>Filters</Text>
        <Text>Coming soon…</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ marginTop: 12 }}>Close</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
