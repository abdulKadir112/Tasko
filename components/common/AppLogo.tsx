import { Image, StyleSheet } from "react-native";

export default function AppLogo() {
  return (
    <Image
      source={require("../../assets/images/logo.png")}
      style={styles.logo}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 130,
    height: 130,
  },
});