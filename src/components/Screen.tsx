import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export function Screen({
  children,
  backgroundColor = "#F9FAFB",
}: {
  children: React.ReactNode;
  backgroundColor?: string;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["top"]}>
      {children}
    </SafeAreaView>
  );
}
