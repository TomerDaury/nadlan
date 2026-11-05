"use client";

import { useEffect } from "react";
import Script from "next/script";

// Chatling chatbot, shown only on the request form page (PRD F1, ADR-14).
// The chatbot id is public (it is part of the embed snippet), so it lives in code.
const CHATBOT_ID = "3753222916";

declare global {
  interface Window {
    chtlConfig?: { chatbotId: string };
  }
}

// The embed script reads this config when it loads.
if (typeof window !== "undefined") {
  window.chtlConfig = { chatbotId: CHATBOT_ID };
}

/** Set on <html> while the chatbot must stay hidden; see globals.css. */
const HIDE_ATTRIBUTE = "data-hide-chatbot";

export function ChatlingWidget() {
  // The script loads once and adds its own elements (#chtl-…) to <body>. They stay there after an
  // in-app navigation (e.g. form → results), so hide them while this page is not shown.
  useEffect(() => {
    document.documentElement.removeAttribute(HIDE_ATTRIBUTE);
    return () => document.documentElement.setAttribute(HIDE_ATTRIBUTE, "");
  }, []);

  return (
    <Script
      id="chtl-script"
      data-id={CHATBOT_ID}
      src="https://chatling.ai/js/embed.js"
      strategy="afterInteractive"
    />
  );
}
