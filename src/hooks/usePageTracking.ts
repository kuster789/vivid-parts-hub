import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const getSessionId = (): string => {
  let id = sessionStorage.getItem("pv_session");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("pv_session", id);
  }
  return id;
};

const getUtmParams = (search: string) => {
  const params = new URLSearchParams(search);
  return {
    utm_source: params.get("utm_source") || null,
    utm_medium: params.get("utm_medium") || null,
    utm_campaign: params.get("utm_campaign") || null,
  };
};

export const usePageTracking = () => {
  const location = useLocation();
  const lastPath = useRef("");

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;

    const sessionId = getSessionId();
    const utm = getUtmParams(location.search);

    supabase.from("page_views").insert({
      session_id: sessionId,
      path,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent || null,
      ...utm,
    } as any).then(() => {});
  }, [location.pathname, location.search]);
};
