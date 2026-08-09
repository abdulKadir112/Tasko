import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthContext } from "@/context/AuthContext";

export default function Index() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // User logged in
  if (user) {
    // Later we will check the user's role from Firestore.
    return <Redirect href="/customer/(tabs)/home" />;
  }

  // User not logged in
  return <Redirect href="/auth/login" />;
}