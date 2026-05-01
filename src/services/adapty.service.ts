import { adapty, createPaywallView, type AdaptyPaywall, type AdaptyPaywallProduct, type AdaptyProfile } from 'react-native-adapty';

import type { PremiumState } from '../types/adapty.types';

const DEFAULT_ACCESS_LEVEL_ID = 'premium';
const DEFAULT_PAYWALL_PLACEMENT_ID = 'main';

export type InitializeAdaptyParams = {
  apiKey?: string;
  customerUserId?: string;
  accessLevelId?: string;
  defaultPlacementId?: string;
};

export type ShowPaywallParams = {
  placementId?: string;
  locale?: string;
};

export type PaywallData = {
  paywall: AdaptyPaywall;
  products: AdaptyPaywallProduct[];
};

class AdaptyService {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private accessLevelId = process.env.EXPO_PUBLIC_ADAPTY_ACCESS_LEVEL_ID ?? DEFAULT_ACCESS_LEVEL_ID;
  private defaultPlacementId = process.env.EXPO_PUBLIC_ADAPTY_PAYWALL_PLACEMENT_ID ?? DEFAULT_PAYWALL_PLACEMENT_ID;

  private resolveApiKey(apiKey?: string): string {
    const resolvedApiKey = apiKey ?? process.env.EXPO_PUBLIC_ADAPTY_SDK_KEY;
    if (!resolvedApiKey) {
      throw new Error('Adapty SDK key is not configured. Set EXPO_PUBLIC_ADAPTY_SDK_KEY.');
    }

    return resolvedApiKey;
  }

  private mapProfileToPremiumState(profile: AdaptyProfile, accessLevelId: string): PremiumState {
    const accessLevel = profile.accessLevels?.[accessLevelId];

    return {
      isPremium: Boolean(accessLevel?.isActive),
      expiresAt: accessLevel?.expiresAt ? accessLevel.expiresAt.getTime() : null,
      productId: accessLevel?.vendorProductId ?? null,
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.initialize();
  }

  async initialize(params: InitializeAdaptyParams = {}): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    if (params.accessLevelId) {
      this.accessLevelId = params.accessLevelId;
    }

    if (params.defaultPlacementId) {
      this.defaultPlacementId = params.defaultPlacementId;
    }

    const apiKey = this.resolveApiKey(params.apiKey);

    this.initializationPromise = (async () => {
      await adapty.activate(apiKey, {
        customerUserId: params.customerUserId,
        __ignoreActivationOnFastRefresh: true,
      });
      this.isInitialized = true;
    })().finally(() => {
      this.initializationPromise = null;
    });

    await this.initializationPromise;
  }

  async getSubscriptionStatus(accessLevelId = this.accessLevelId): Promise<PremiumState> {
    await this.ensureInitialized();
    const profile = await adapty.getProfile();
    return this.mapProfileToPremiumState(profile, accessLevelId);
  }

  async getPaywallData(placementId = this.defaultPlacementId, locale?: string): Promise<PaywallData> {
    await this.ensureInitialized();
    const paywall = await adapty.getPaywall(placementId, locale);
    const products = await adapty.getPaywallProducts(paywall);

    return {
      paywall,
      products,
    };
  }

  async showPaywall(params: ShowPaywallParams = {}): Promise<PaywallData> {
    const placementId = params.placementId ?? this.defaultPlacementId;
    const paywallData = await this.getPaywallData(placementId, params.locale);
    const view = await createPaywallView(paywallData.paywall);

    await view.present();

    return paywallData;
  }

  async restorePurchases(): Promise<PremiumState> {
    await this.ensureInitialized();
    const profile = await adapty.restorePurchases();
    return this.mapProfileToPremiumState(profile, this.accessLevelId);
  }
}

export const adaptyService = new AdaptyService();

