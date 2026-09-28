"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_WEBSITE_THEME,
  type WebsiteTheme,
} from "@custom-website-builder/node-registry";

const WebsiteThemeContext = createContext<WebsiteTheme>(DEFAULT_WEBSITE_THEME);

export function WebsiteThemeProvider({
  theme,
  children,
}: {
  theme?: WebsiteTheme | null;
  children: ReactNode;
}) {
  return (
    <WebsiteThemeContext.Provider value={theme ?? DEFAULT_WEBSITE_THEME}>
      {children}
    </WebsiteThemeContext.Provider>
  );
}

export function useWebsiteTheme() {
  return useContext(WebsiteThemeContext);
}
