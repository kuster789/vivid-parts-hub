export const GOOGLE_ANALYTICS_CONFIG = {
  ga4MeasurementId: "G-LXHHL5SZ4P",
  googleAdsId: "AW-862271353",
  labels: {
    purchase: "PUveCKvY0sMcEPnulJsD",
    whatsapp: "NHzYCK7Y0sMcEPnulJsD",
    addToCart: "cEjgCLHY0sMcEPnulJsD",
  },
} as const;

const CONSENT_STORAGE_KEY = "agrale_google_consent";
const PENDING_PURCHASE_STORAGE_KEY = "agrale_pending_google_purchase";

type ConsentChoice = "granted" | "denied";

type ProductLike = {
  id: string;
  name: string;
  price: number | string;
  brand?: string | null;
  model?: string | null;
  sku?: string | null;
};

type CartItemLike = {
  product: ProductLike;
  quantity: number;
};

export type GooglePurchasePayload = {
  transactionId: string;
  value: number;
  items: CartItemLike[];
  shipping?: number;
  coupon?: string | null;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const hasBrowser = () => typeof window !== "undefined";

const gtag = (...args: unknown[]) => {
  if (!hasBrowser()) return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === "function") {
    window.gtag(...args);
    return;
  }
  window.dataLayer.push(args);
};

const conversionDestination = (label: string) => `${GOOGLE_ANALYTICS_CONFIG.googleAdsId}/${label}`;

const consentPayload = (choice: ConsentChoice) => ({
  analytics_storage: choice,
  ad_storage: choice,
  ad_user_data: choice,
  ad_personalization: choice,
});

const toPrice = (price: number | string | undefined | null) => {
  const numeric = Number(price ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const googleItem = (product: ProductLike, quantity = 1) => ({
  item_id: product.sku || product.id,
  item_name: product.name,
  item_brand: product.brand || undefined,
  item_variant: product.model || undefined,
  price: toPrice(product.price),
  quantity,
});

const googleItems = (items: CartItemLike[]) => items.map((item) => googleItem(item.product, item.quantity));

export const getGoogleConsentChoice = (): ConsentChoice | null => {
  if (!hasBrowser()) return null;
  const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return stored === "granted" || stored === "denied" ? stored : null;
};

export const updateGoogleConsent = (choice: ConsentChoice, persist = true) => {
  if (!hasBrowser()) return;
  if (persist) window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  gtag("consent", "update", consentPayload(choice));
  gtag("event", choice === "granted" ? "cookie_consent_granted" : "cookie_consent_denied", {
    event_category: "privacy",
    event_label: "lgpd_banner",
  });
};

export const applyStoredGoogleConsent = () => {
  const choice = getGoogleConsentChoice();
  if (choice) updateGoogleConsent(choice, false);
};

export const trackGooglePageView = (path: string) => {
  if (!hasBrowser()) return;
  const pageLocation = `${window.location.origin}${path}`;
  const payload = {
    page_path: path,
    page_location: pageLocation,
    page_title: document.title,
  };

  // SPA page view: config updates are the recommended gtag path for route changes.
  gtag("config", GOOGLE_ANALYTICS_CONFIG.ga4MeasurementId, payload);
  gtag("config", GOOGLE_ANALYTICS_CONFIG.googleAdsId, payload);
};

export const trackGoogleViewItem = (product: ProductLike) => {
  const price = toPrice(product.price);
  gtag("event", "view_item", {
    currency: "BRL",
    value: price,
    items: [googleItem(product)],
  });
};

export const trackGoogleAddToCart = (product: ProductLike, quantity = 1) => {
  const value = toPrice(product.price) * quantity;
  const items = [googleItem(product, quantity)];

  gtag("event", "add_to_cart", {
    currency: "BRL",
    value,
    items,
  });

  gtag("event", "conversion", {
    send_to: conversionDestination(GOOGLE_ANALYTICS_CONFIG.labels.addToCart),
    value,
    currency: "BRL",
  });
};

export const trackGoogleBeginCheckout = (items: CartItemLike[], value: number) => {
  gtag("event", "begin_checkout", {
    currency: "BRL",
    value,
    items: googleItems(items),
  });
};

export const trackGooglePurchase = ({ transactionId, value, items, shipping = 0, coupon }: GooglePurchasePayload) => {
  if (!hasBrowser() || !transactionId) return;

  const dedupeKey = `agrale_google_purchase_${transactionId}`;
  if (window.localStorage.getItem(dedupeKey)) return;

  const ecommercePayload = {
    transaction_id: transactionId,
    affiliation: "Moto Peças Agrale",
    currency: "BRL",
    value,
    shipping,
    coupon: coupon || undefined,
    items: googleItems(items),
  };

  gtag("event", "purchase", ecommercePayload);
  gtag("event", "conversion", {
    send_to: conversionDestination(GOOGLE_ANALYTICS_CONFIG.labels.purchase),
    value,
    currency: "BRL",
    transaction_id: transactionId,
  });

  window.localStorage.setItem(dedupeKey, "1");
};

export const trackGoogleWhatsAppClick = (linkLocation: string) => {
  gtag("event", "whatsapp_click", {
    event_category: "contact",
    event_label: linkLocation,
    link_location: linkLocation,
    page_path: hasBrowser() ? window.location.pathname : undefined,
  });

  gtag("event", "conversion", {
    send_to: conversionDestination(GOOGLE_ANALYTICS_CONFIG.labels.whatsapp),
    value: 1,
    currency: "BRL",
  });
};

export const storePendingGooglePurchase = (payload: GooglePurchasePayload) => {
  if (!hasBrowser()) return;
  window.localStorage.setItem(PENDING_PURCHASE_STORAGE_KEY, JSON.stringify(payload));
};

export const readPendingGooglePurchase = (): GooglePurchasePayload | null => {
  if (!hasBrowser()) return null;
  try {
    const stored = window.localStorage.getItem(PENDING_PURCHASE_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as GooglePurchasePayload) : null;
  } catch {
    return null;
  }
};

export const clearPendingGooglePurchase = () => {
  if (!hasBrowser()) return;
  window.localStorage.removeItem(PENDING_PURCHASE_STORAGE_KEY);
};
