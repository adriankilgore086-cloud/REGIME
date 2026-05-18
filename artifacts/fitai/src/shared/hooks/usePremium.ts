import { useFitness } from "@store/FitnessContext";
import { useCallback } from "react";

export interface UsePremiumResult {
  isPremium: boolean;
  showPaywall: () => void;
}

/**
 * Returns whether the current user has an active premium subscription,
 * and a helper to show the upgrade prompt.
 *
 * Real purchase flow (RevenueCat / StoreKit / Billing) will be wired here in a
 * later phase. For now it reads `isPremium` from the local profile state.
 */
export function usePremium(): UsePremiumResult {
  const { userProfile } = useFitness();

  const isPremium = userProfile?.isPremium ?? false;

  const showPaywall = useCallback(() => {
    // TODO: Open premium upgrade sheet (RevenueCat in a later phase)
    console.log("[Paywall] upgrade prompt triggered");
  }, []);

  return { isPremium, showPaywall };
}
