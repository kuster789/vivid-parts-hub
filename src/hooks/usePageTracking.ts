import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "@/utils/analytics";
import { trackGooglePageView } from "@/lib/googleAnalytics";

export const usePageTracking = () => {
  const location = useLocation();
  const lastPath = useRef("");
  const isFirstTrackedPath = useRef(true);

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    if (path === lastPath.current) return;
    lastPath.current = path;

    trackEvent({ event_type: "page_view", path });

    // The initial page_view is sent by the inline Google tag in index.html.
    // Only send virtual page_views here for subsequent SPA route changes.
    if (isFirstTrackedPath.current) {
      isFirstTrackedPath.current = false;
      return;
    }

    trackGooglePageView(path);
  }, [location.pathname, location.search]);
};
