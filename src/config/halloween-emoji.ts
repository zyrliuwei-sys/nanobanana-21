/**
 * Halloween emoji page data (client-safe, no server imports).
 *
 * - Emoji categories feed the click-to-copy grid; `key` maps to the
 *   `halloween.cat.<key>` i18n label (static lookups in the blocks).
 * - There is no official Unicode "Halloween set" — this is the community
 *   canon (~95 symbols) grouped the way the top-ranking copy-paste pages do.
 * - Presets feed the AI generator chips. Prompts stay in English — the model
 *   reads them as-is (same convention as config/showcase.ts).
 */

export type EmojiCategory = {
  key: string;
  emojis: string[];
};

export const HALLOWEEN_EMOJI_CATEGORIES: EmojiCategory[] = [
  { key: 'pumpkins', emojis: ['🎃'] },
  { key: 'ghosts', emojis: ['👻', '🫥', '🫧'] },
  {
    key: 'skulls',
    emojis: ['💀', '☠️', '🦴', '🩻', '⚰️', '⚱️', '🪦', '🩸', '🥀'],
  },
  {
    key: 'monsters',
    emojis: [
      '🧟',
      '🧟‍♀️',
      '🧟‍♂️',
      '🧛',
      '🧛‍♀️',
      '🧛‍♂️',
      '🐺',
      '👹',
      '👺',
      '🧌',
      '😈',
      '👿',
      '🤡',
      '👽',
      '👾',
      '🤖',
      '🦹',
    ],
  },
  {
    key: 'witches',
    emojis: ['🧙', '🧙‍♀️', '🧙‍♂️', '🧚', '🧞', '🧝', '🔮', '🪄', '🧹', '🧿'],
  },
  {
    key: 'critters',
    emojis: [
      '🦇',
      '🕷️',
      '🕸️',
      '🐈‍⬛',
      '🦉',
      '🐍',
      '🐀',
      '🐦‍⬛',
      '🦂',
      '🪳',
      '🪲',
      '🪱',
    ],
  },
  { key: 'candy', emojis: ['🍬', '🍭', '🍫', '🍪', '🍎', '🥧', '🍿'] },
  {
    key: 'faces',
    emojis: ['😱', '😨', '😬', '😵', '🤪', '🫣', '🫢', '🙀', '👁️', '🧠', '🫀'],
  },
  {
    key: 'night',
    emojis: [
      '🌕',
      '🌑',
      '🌚',
      '🌙',
      '🌃',
      '🏚️',
      '🏰',
      '🚪',
      '🕯️',
      '⛓️',
      '🗡️',
      '🔪',
      '🔦',
      '🧪',
      '🌫️',
      '🌩️',
      '⛈️',
      '⚡',
      '🍂',
      '🍁',
      '🪾',
    ],
  },
  { key: 'party', emojis: ['🥳', '🎉', '🎭', '🎪', '🥸', '🎩', '🧡', '🖤'] },
];

/** Ready-made combo strings shown under the copy grid. */
export const HALLOWEEN_COMBOS: { key: string; emojis: string }[] = [
  { key: 'trick_or_treat', emojis: '🎃👻🍬🍭' },
  { key: 'spooky_night', emojis: '🌕🐺🏚️🌫️' },
  { key: 'web', emojis: '🕸️🕷️🕸️' },
  { key: 'witchy', emojis: '🧙‍♀️🔮🧹✨' },
  { key: 'haunted', emojis: '💀☠️⚰️🪦' },
  { key: 'cute_spooky', emojis: '👻🧡🖤🦇' },
];

/** Horror kaomoji — copyable text faces, the other classic "spooky text". */
export const HALLOWEEN_KAOMOJI = ['(⊙﹏⊙)', 'Σ(ﾟДﾟ)', 'ψ(｀∇´)ψ', '(x_x)⚱️'];

/** Emojis with their own meaning blurb in the content section. */
export const HALLOWEEN_MEANINGS: { key: string; emoji: string }[] = [
  { key: 'pumpkin', emoji: '🎃' },
  { key: 'ghost', emoji: '👻' },
  { key: 'skull', emoji: '💀' },
  { key: 'zombie', emoji: '🧟' },
  { key: 'vampire', emoji: '🧛' },
  { key: 'witch', emoji: '🧙‍♀️' },
  { key: 'bat', emoji: '🦇' },
  { key: 'spider', emoji: '🕷️' },
  { key: 'web', emoji: '🕸️' },
  { key: 'cat', emoji: '🐈‍⬛' },
  { key: 'moon', emoji: '🌚' },
  { key: 'candles', emoji: '🕯️' },
];

export type HalloweenPreset = {
  key: string;
  /** Thumbnail shown on the preset chip. */
  src: string;
  /** Full prompt injected into the generator when the chip is picked. */
  prompt: string;
};

/**
 * AI generator presets. `src` images are illustrative examples of the preset
 * style (generated placeholders — same convention as showcase.ts).
 */
export const HALLOWEEN_PRESETS: HalloweenPreset[] = [
  {
    key: 'ghost',
    src: '/imgs/generated/halloween-ghost-1793603896063.jpg',
    prompt:
      'A cute glossy 3D emoji sticker of a friendly kawaii ghost with rosy cheeks, floating with tiny stubby arms waving, translucent white body with a soft glow, deep purple background, Halloween style, centered, no text',
  },
  {
    key: 'pumpkin',
    src: '/imgs/generated/halloween-pumpkin-1793604100.jpg',
    prompt:
      'A glossy 3D emoji sticker of a carved jack-o-lantern with a spooky but cute asymmetric grin and glowing yellow eyes, warm orange skin, a curly green stem, deep purple background, Halloween style, centered, no text',
  },
  {
    key: 'zombie',
    src: '/imgs/generated/halloween-zombie-1793604100.jpg',
    prompt:
      'A glossy 3D emoji sticker of a friendly cartoon zombie face with green skin, a stitched smile, one droopy eye and a bandage on the forehead, deep purple background, Halloween style, centered, no text',
  },
  {
    key: 'cat',
    src: '/imgs/generated/halloween-cat-1793604100.jpg',
    prompt:
      'A glossy 3D emoji sticker of a cute black cat with big glowing yellow eyes wearing a tiny purple witch hat, curled whiskers, deep purple background, Halloween style, centered, no text',
  },
  {
    key: 'bat',
    src: '/imgs/generated/halloween-bat-1793604100.jpg',
    prompt:
      'A glossy 3D emoji sticker of a cute vampire bat with tiny white fangs and dark round wings spread wide, big friendly eyes, deep purple background, Halloween style, centered, no text',
  },
  {
    key: 'skull',
    src: '/imgs/generated/halloween-skull-1793604100.jpg',
    prompt:
      'A glossy 3D emoji sticker of a smiling candy sugar skull with colorful marigold flower eyes and candy-corn colored decorations, deep purple background, Halloween style, centered, no text',
  },
];

/** Default prompt suggested under the presets. */
export const HALLOWEEN_BASE_PROMPT =
  'A glossy 3D emoji sticker of a cute Halloween character, deep purple background, centered, no text';
