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
 * nanobanana 2.1 catalog: two groups (one-time packs, monthly plans), three
 * tiers each. An image costs 7x its Evolink price at $0.01 per credit (25 /
 * 35 / 75 credits for 1K / 2K / 4K, +2 per reference image; see
 * ./image-gen.ts), so every product here sells credits at >= $0.01 each:
 * that floor is what keeps the 7x margin true on discounted tiers. Check
 * priceInCents / credits >= 1 before adding or changing a product.
 *
 * Product IDs are kept from the previous catalog so payment-provider product
 * mappings still resolve (providers with fixed-price products need their
 * prices updated to match). Keys MUST match what the pricing UI sends.
 */
function pack(
  productId: string,
  name: string,
  priceInCents: number,
  credits: number
): PricingProduct {
  return {
    productId,
    productName: name,
    planName: name,
    description: name,
    type: PaymentType.ONE_TIME,
    priceInCents,
    currency: 'usd',
    credits,
  };
}

function monthly(
  productId: string,
  name: string,
  priceInCents: number,
  credits: number
): PricingProduct {
  return {
    productId,
    productName: name,
    planName: `${name} Monthly`,
    description: `${name} Monthly`,
    type: PaymentType.SUBSCRIPTION,
    priceInCents,
    currency: 'usd',
    credits,
    plan: { name, interval: PaymentInterval.MONTH, intervalCount: 1 },
  };
}

export const pricingCatalog: Record<string, PricingProduct> = {
  // One-time packs: credits never expire. $0.0124 / $0.0115 / $0.0100.
  pack_starter: pack('pack_starter', 'Starter Pack', 990, 800),
  pack_standard: pack('pack_standard', 'Standard Pack', 2990, 2600),
  pack_pro: pack('pack_pro', 'Pro Pack', 6990, 6990),
  // Monthly plans: refill every month, best value. $0.0110 / $0.0104 / $0.0100.
  basic_monthly: monthly('basic_monthly', 'Basic', 990, 900),
  pro_monthly: monthly('pro_monthly', 'Pro', 2490, 2400),
  studio_monthly: monthly('studio_monthly', 'Studio', 5990, 5990),
};

export function getPricingProduct(productId: string): PricingProduct | null {
  if (!productId) return null;
  return pricingCatalog[productId] ?? null;
}

export function listPricingProducts(): PricingProduct[] {
  return Object.values(pricingCatalog);
}
