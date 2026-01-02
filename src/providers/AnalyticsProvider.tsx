"use client";

import { useEffect } from "react";
import { analytics } from "@/config/firebase";
import { logEvent } from "firebase/analytics";

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    if (analytics) {
      // Log initial page view
      logEvent(analytics, "page_view", {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname,
      });

      console.log("Firebase Analytics initialized");
    }
  }, []);

  return <>{children}</>;
}

export default AnalyticsProvider;
