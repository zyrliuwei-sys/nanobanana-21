/**
 * Nano Banana 2.1 image generation options and credit pricing
 * (client-safe, no server imports).
 *
 * 1 credit is sold at ~$0.01 (see ./pricing.ts). Defaults can be overridden
 * per resolution in admin → Settings → AI → Nano Banana 2.1.
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

export const DEFAULT_IMAGE_CREDITS: Record<ImageResolution, number> = {
  '1K': 10,
  '2K': 15,
  '4K': 25,
};

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
