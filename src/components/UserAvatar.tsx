import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type Props = {
  avatarUrl?: string | null;
  name?: string | null;
  style?: object | any[] | null;
  textStyle?: object | any[] | null;
};

export function UserAvatar({ avatarUrl, name, style, textStyle }: Props) {
  return (
    <View style={[style, s.overflow]}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <Text style={textStyle}>{initials(name)}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  overflow: { overflow: "hidden" },
});
