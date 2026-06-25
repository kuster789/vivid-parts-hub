import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "@/utils/analytics";
import { trackGooglePageView } from "@/lib/googleAnalytics";

export const usePageTracking = () => {
  const location = useLocation();
  const lastPath = useRef("");

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    if (path === lastPath.current) return;
    lastPath.current = path;

    trackEvent({ event_type: "page_view", path });
    trackGooglePageView(path);
  }, [location.pathname, location.search]);
};
