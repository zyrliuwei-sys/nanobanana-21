/**
 * Authoritative pricing catalog.
 *
 * The checkout API uses this as the SOURCE OF TRUTH for price/credits/duration.
 * Any price, credits, or plan info sent by the client is IGNORED — only the
 * product_id is honored, and everything else is looked up here.
 *
 * To change pricing, edit this file and redeploy. Admin UI cannot alter prices.
 */

import { PaymentInterval, PaymentType } from '@/core/payment/types';

export type PricingPlanInfo = {
  name: string;
  interval: PaymentInterval;
  intervalCount: number;
};

export type PricingProduct = {
  productId: string;
  productName: string;
  planName: string;
  description: string;
  type: PaymentType;
  priceInCents: number;
  currency: string;
  credits: number;
  creditsValidDays?: number;
  plan?: PricingPlanInfo;
};

/**
 * nanobanana 2.1 catalog. One image costs 10 / 15 / 25 credits at 1K / 2K / 4K
 * (see ./image-gen.ts; admin can override). Credits are priced at roughly
 * $0.01 each, with bigger packs and subscriptions slightly cheaper.
 *
 * Prices and product IDs are unchanged from the previous catalog so existing
 * payment-provider product mappings keep working — only credits changed.
 * Keys MUST match what the pricing UI sends as product_id.
 */
export const pricingCatalog: Record<string, PricingProduct> = {
  pack_single: {
    productId: 'pack_single',
    productName: 'Mini Pack',
    planName: 'Mini Pack',
    description: 'Mini Pack',
    type: PaymentType.ONE_TIME,
    priceInCents: 490,
    currency: 'usd',
    credits: 500,
  },
  pack_starter: {
    productId: 'pack_starter',
    productName: 'Starter Pack',
    planName: 'Starter Pack',
    description: 'Starter Pack',
    type: PaymentType.ONE_TIME,
    priceInCents: 990,
    currency: 'usd',
    credits: 1100,
  },
  pack_standard: {
    productId: 'pack_standard',
    productName: 'Standard Pack',
    planName: 'Standard Pack',
    description: 'Standard Pack',
    type: PaymentType.ONE_TIME,
    priceInCents: 2300,
    currency: 'usd',
    credits: 2600,
  },
  pack_pro: {
    productId: 'pack_pro',
    productName: 'Pro Pack',
    planName: 'Pro Pack',
    description: 'Pro Pack',
    type: PaymentType.ONE_TIME,
    priceInCents: 4400,
    currency: 'usd',
    credits: 5200,
  },
  basic_monthly: {
    productId: 'basic_monthly',
    productName: 'Basic',
    planName: 'Basic Monthly',
    description: 'Basic Monthly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 2300,
    currency: 'usd',
    credits: 2800,
    plan: {
      name: 'Basic',
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  },
  pro_monthly: {
    productId: 'pro_monthly',
    productName: 'Pro',
    planName: 'Pro Monthly',
    description: 'Pro Monthly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 4400,
    currency: 'usd',
    credits: 6000,
    plan: {
      name: 'Pro',
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  },
  studio_monthly: {
    productId: 'studio_monthly',
    productName: 'Studio',
    planName: 'Studio Monthly',
    description: 'Studio Monthly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 8800,
    currency: 'usd',
    credits: 13000,
    plan: {
      name: 'Studio',
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  },
};

export function getPricingProduct(productId: string): PricingProduct | null {
  if (!productId) return null;
  return pricingCatalog[productId] ?? null;
}

export function listPricingProducts(): PricingProduct[] {
  return Object.values(pricingCatalog);
}
