import React from "react";
import { Platform, Pressable, Linking } from "react-native";

export const WebAnchor = ({
  href,
  download,
  target = "_blank",
  children,
  style,
}) => {
  if (Platform.OS === "web") {
    return (
      <a
        href={href}
        download={download}
        target={href.startsWith("#") ? "_self" : target}
        rel="noopener noreferrer"
        style={{ textDecoration: "none", display: "inline-block" }}
      >
        <Pressable style={style}>{children}</Pressable>
      </a>
    );
  }

  return (
    <Pressable style={style} onPress={() => Linking.openURL(href)}>
      {children}
    </Pressable>
  );
};