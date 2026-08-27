import { Capacitor } from "@capacitor/core";

/**
 * Google Play policy: digital content consumed inside the app (CBT
 * subscriptions, wallet top-ups, result-checker e-PINs) may not be paid for
 * with an alternative payment processor inside the Android app.
 *
 * Real-world services (admission processing, Post-UTME application handling)
 * are exempt and can keep in-app checkout.
 */
export const isNativeApp = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/** True when an in-app checkout for digital content is allowed. */
export const canPurchaseDigitalInApp = (): boolean => !isNativeApp();

export const WEB_APP_ORIGIN = "https://edura.com.ng";

/** Message shown in place of a digital-goods checkout inside the app. */
export const DIGITAL_PURCHASE_NOTICE =
  "Wallet top-ups and subscriptions are managed on your Edura web dashboard. Your balance here updates automatically.";
