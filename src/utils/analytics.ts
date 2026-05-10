import { supabase } from "@/integrations/supabase/client";

export type EventType = 
  | "page_view" 
  | "product_view" 
  | "add_to_cart" 
  | "remove_from_cart" 
  | "checkout_started" 
  | "order_created" 
  | "payment_approved" 
  | "search_performed" 
  | "search_no_results" 
  | "whatsapp_click" 
  | "lead_created" 
  | "quote_requested";

interface TrackEventParams {
  event_type: EventType;
  path?: string;
  metadata?: Record<string, any>;
}

const getSessionId = () => {
  let sessionId = localStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
};

const getAnonymousId = () => {
  let anonId = localStorage.getItem("analytics_anonymous_id");
  if (!anonId) {
    anonId = crypto.randomUUID();
    localStorage.setItem("analytics_anonymous_id", anonId);
  }
  return anonId;
};

export const trackEvent = async ({ event_type, path, metadata = {} }: TrackEventParams) => {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    
    const { data: { user } } = await supabase.auth.getUser();

    // Basic browser info
    const userAgent = window.navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    const eventData = {
      event_type,
      session_id: getSessionId(),
      user_id: user?.id,
      anonymous_id: getAnonymousId(),
      path: path || window.location.pathname,
      referrer: document.referrer,
      utm_source: searchParams.get("utm_source"),
      utm_medium: searchParams.get("utm_medium"),
      utm_campaign: searchParams.get("utm_campaign"),
      utm_content: searchParams.get("utm_content"),
      utm_term: searchParams.get("utm_term"),
      device_type: isMobile ? "mobile" : "desktop",
      browser: userAgent,
      metadata,
    };

    // Use a background task to not block UI
    supabase.from("analytics_events").insert(eventData).then(({ error }) => {
      if (error) console.warn("Analytics error:", error.message);
    });
  } catch (err) {
    // Fail silently in production to not break UX
    console.error("Tracking failure:", err);
  }
};
