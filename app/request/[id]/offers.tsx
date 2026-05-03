import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function OffersRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  useEffect(() => {
    // Applicants are shown on the job detail page
    router.replace(`/request/${id}`);
  }, [id]);
  return (
    <View style={{ flex: 1 }}>
      <ActivityIndicator style={{ flex: 1 }} />
    </View>
  );
}
