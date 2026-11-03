import type { AspectRatio } from './image-gen';

/** EvoLink's documented Seedream route; never accept a model ID from a client. */
export const SEEDREAM_ENGINE = 'seedream-5-0';
export const SEEDREAM_MODEL = 'doubao-seedream-5.0-lite';
export const SEEDREAM_RESOLUTION = '2K' as const;
export const SEEDREAM_RATIOS = [
  '1:1',
  '4:3',
  '3:4',
  '16:9',
  '9:16',
] as const satisfies readonly AspectRatio[];

/** $0.028/image + allowance, with the site's 7x markup, rounded up. */
export const DEFAULT_SEEDREAM_CREDITS = 25;

export function resolveSeedreamCredits(configs: Record<string, string>) {
  const override = Number(configs.seedream_credits_2k);
  return Number.isFinite(override) && override > 0
    ? Math.ceil(override)
    : DEFAULT_SEEDREAM_CREDITS;
}

export function isSeedreamRatio(
  value: unknown
): value is (typeof SEEDREAM_RATIOS)[number] {
  return (SEEDREAM_RATIOS as readonly unknown[]).includes(value);
}
