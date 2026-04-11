import { Stack } from "expo-router";

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: "modal" }}>
      <Stack.Screen
        name="create-offer"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: [0.55, 0.75],
          sheetGrabberVisible: true,
          sheetCornerRadius: 20,
        }}
      />
      <Stack.Screen
        name="counter-offer"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: [0.55, 0.75],
          sheetGrabberVisible: true,
          sheetCornerRadius: 20,
        }}
      />
      <Stack.Screen
        name="edit-offer"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: [0.55, 0.75],
          sheetGrabberVisible: true,
          sheetCornerRadius: 20,
        }}
      />
    </Stack>
  );
}
