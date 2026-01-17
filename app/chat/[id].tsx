import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Chat</Text>
      <Text>Chat/Offer ID: {id}</Text>
    </View>
  );
}
