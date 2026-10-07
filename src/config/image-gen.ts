/**
 * Nano Banana 2.1 image generation options and credit pricing
 * (client-safe, no server imports).
 *
 * Generation runs on Evolink (gemini-nano-banana-2.1). Every image is
 * charged at 7x its Evolink list price, valuing 1 credit at $0.01; the
 * pricing catalog (./pricing.ts) never sells credits below $0.01, so the 7x
 * margin holds for every pack and plan. Admins can override the defaults in
 * admin -> Settings -> AI -> Nano Banana 2.1.
 */

export const DEFAULT_IMAGE_MODEL = 'gemini-nano-banana-2.1';

/** Max reference images per request (model limit). */
export const MAX_REFERENCE_IMAGES = 14;

export const MAX_PROMPT_LENGTH = 4000;

export const IMAGE_RESOLUTIONS = ['1K', '2K', '4K'] as const;
export type ImageResolution = (typeof IMAGE_RESOLUTIONS)[number];
export const DEFAULT_RESOLUTION: ImageResolution = '1K';

/** Aspect ratios accepted by gemini-nano-banana-2.1. */
export const ASPECT_RATIOS = [
  '1:1',
  '16:9',
  '9:16',
  '4:3',
  '3:4',
  '3:2',
  '2:3',
  '5:4',
  '4:5',
  '21:9',
  '4:1',
  '1:4',
  '8:1',
  '1:8',
] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];
export const DEFAULT_ASPECT_RATIO: AspectRatio = '1:1';

/** Evolink list prices in USD (evolink.ai/nano-banana-2-1, 2026-10-07). */
export const EVOLINK_IMAGE_USD: Record<ImageResolution, number> = {
  '1K': 0.031,
  '2K': 0.046,
  '4K': 0.103,
};
export const EVOLINK_REFERENCE_USD = 0.0016;
/** Allowance for prompt/thinking tokens (~$0.0014 / $0.0068 per 1K). */
export const EVOLINK_TEXT_ALLOWANCE_USD = 0.002;
export const PRICE_MARKUP = 7;
export const USD_PER_CREDIT = 0.01;

/** 7x cost in credits, rounded up to a multiple of `step`. */
function marked(usd: number, step: number) {
  const credits = (usd * PRICE_MARKUP) / USD_PER_CREDIT;
  return Math.ceil(Number(credits.toFixed(6)) / step) * step;
}

/** 25 / 35 / 75 credits per 1K / 2K / 4K image. */
export const DEFAULT_IMAGE_CREDITS: Record<ImageResolution, number> = {
  '1K': marked(EVOLINK_IMAGE_USD['1K'] + EVOLINK_TEXT_ALLOWANCE_USD, 5),
  '2K': marked(EVOLINK_IMAGE_USD['2K'] + EVOLINK_TEXT_ALLOWANCE_USD, 5),
  '4K': marked(EVOLINK_IMAGE_USD['4K'] + EVOLINK_TEXT_ALLOWANCE_USD, 5),
};

/** 2 credits per reference image. */
export const DEFAULT_REFERENCE_CREDITS = marked(EVOLINK_REFERENCE_USD, 1);

export function isImageResolution(value: unknown): value is ImageResolution {
  return (
    typeof value === 'string' &&
    (IMAGE_RESOLUTIONS as readonly string[]).includes(value)
  );
}

export function isAspectRatio(value: unknown): value is AspectRatio {
  return (
    typeof value === 'string' &&
    (ASPECT_RATIOS as readonly string[]).includes(value)
  );
}

/** Credits per image at each resolution; admin overrides win. */
export function resolveImageCredits(
  configs: Record<string, string>
): Record<ImageResolution, number> {
  const pick = (res: ImageResolution) => {
    const override = Number(configs[`image_credits_${res.toLowerCase()}`]);
    return Number.isFinite(override) && override > 0
      ? Math.ceil(override)
      : DEFAULT_IMAGE_CREDITS[res];
  };
  return { '1K': pick('1K'), '2K': pick('2K'), '4K': pick('4K') };
}

/** Credits per reference image; admin override `image_credits_ref` wins. */
export function resolveReferenceCredits(configs: Record<string, string>) {
  const raw = configs.image_credits_ref?.trim();
  // Empty means "use default" (Number('') would be 0 = free references).
  const override = raw ? Number(raw) : NaN;
  return Number.isFinite(override) && override >= 0
    ? Math.ceil(override)
    : DEFAULT_REFERENCE_CREDITS;
}

/** Total credits for one generation. */
export function imageCost(
  perImage: Record<ImageResolution, number>,
  perReference: number,
  resolution: ImageResolution,
  references: number
) {
  return perImage[resolution] + perReference * references;
}
