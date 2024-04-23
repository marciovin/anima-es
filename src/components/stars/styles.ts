import { StyleSheet } from "react-native";
import { THEME } from "../../styles/theme";

export const styles = StyleSheet.create({
  container: {
    justifyContent: "flex-end",
    alignItems: "center"
  },
  canvas: {
    width: 257,
    height: 249,
    position: "absolute",
    zIndex: 1
  }
})