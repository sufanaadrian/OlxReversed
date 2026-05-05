import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import { makeStyles } from "./offers.styles";

export default function OffersRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  useEffect(() => {
    // Applicants are shown on the job detail page
    router.replace(`/request/${id}`);
  }, [id]);
  return (
    <View style={styles.container}>
      <ActivityIndicator style={styles.loader} />
    </View>
  );
}
