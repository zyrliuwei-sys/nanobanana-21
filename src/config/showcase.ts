/**
 * Example prompts shown in the generator ("Try these examples") and the
 * showcase gallery. Prompts stay in English — the model reads them as-is.
 *
 * The images are illustrative placeholders; replace them with real
 * Nano Banana 2.1 outputs (same paths) once generation is configured.
 */
export type ShowcaseItem = {
  key: string;
  src: string;
  prompt: string;
  aspectRatio: '4:5' | '1:1' | '16:9' | '9:16' | '3:4';
};

/** Showcase gallery further down the page (click loads the prompt). */
export const SHOWCASE: ShowcaseItem[] = [
  {
    key: 'portrait',
    src: '/imgs/generated/showcase-portrait.jpg',
    prompt:
      'Editorial portrait of a young woman with freckles in golden hour light, natural skin texture, shallow depth of field, shot on 85mm',
    aspectRatio: '4:5',
  },
  {
    key: 'product',
    src: '/imgs/generated/showcase-product.jpg',
    prompt:
      'Luxury perfume bottle standing on wet black volcanic rocks, lime green rim light, water droplets, studio product photography',
    aspectRatio: '4:5',
  },
  {
    key: 'fashion',
    src: '/imgs/generated/showcase-fashion.jpg',
    prompt:
      'Fashion model in an oversized neon lime jacket on a rainy Tokyo street at night, cinematic reflections',
    aspectRatio: '4:5',
  },
  {
    key: 'food',
    src: '/imgs/generated/showcase-food.jpg',
    prompt:
      'Overhead shot of a ramen bowl with a soft-boiled egg, rising steam, dark slate table, moody food photography',
    aspectRatio: '4:5',
  },
  {
    key: 'anime',
    src: '/imgs/generated/showcase-anime.jpg',
    prompt:
      'Anime-style girl riding a bicycle through a sunflower field under a vivid summer sky, hand-painted look',
    aspectRatio: '4:5',
  },
  {
    key: 'architecture',
    src: '/imgs/generated/showcase-architecture.jpg',
    prompt:
      'Futuristic white museum with a curved concrete facade at blue hour, architectural photography',
    aspectRatio: '4:5',
  },
  {
    key: 'landscape',
    src: '/imgs/generated/showcase-landscape.jpg',
    prompt:
      'Aerial view of a turquoise lagoon and a white sand island, ultra-detailed 4K landscape photography',
    aspectRatio: '4:5',
  },
  {
    key: 'character',
    src: '/imgs/generated/showcase-character.jpg',
    prompt:
      'Cute 3D clay character of a banana astronaut floating in space, soft lighting, Pixar-style render',
    aspectRatio: '4:5',
  },
];

/**
 * Quick-start examples in the generator — a separate set from SHOWCASE so the
 * page never shows the same picture twice.
 */
export const STUDIO_EXAMPLES: ShowcaseItem[] = [
  {
    key: 'coffee',
    src: '/imgs/generated/example-coffee.jpg',
    prompt:
      'Iced latte in a tall glass with swirling milk on a sunlit marble cafe table, morning window light, lifestyle product photography',
    aspectRatio: '4:5',
  },
  {
    key: 'cat',
    src: '/imgs/generated/example-cat.jpg',
    prompt:
      'Fluffy orange cat wearing tiny round glasses reading a newspaper in a cozy armchair, warm lamp light, whimsical photorealistic',
    aspectRatio: '4:5',
  },
  {
    key: 'sneaker',
    src: '/imgs/generated/example-sneaker.jpg',
    prompt:
      'Chunky retro sneaker splashing through a puddle, frozen water droplets, bright cobalt blue background, high-speed sports advertising photography',
    aspectRatio: '4:5',
  },
  {
    key: 'watercolor',
    src: '/imgs/generated/example-watercolor.jpg',
    prompt:
      'Loose watercolor painting of a Venetian canal with gondolas at sunset, soft washes of peach and teal, visible paper texture',
    aspectRatio: '4:5',
  },
  {
    key: 'cyberpunk',
    src: '/imgs/generated/example-cyberpunk.jpg',
    prompt:
      'Cyberpunk samurai standing in neon purple rain on a rooftop above a futuristic city, cinematic concept art, dramatic lighting',
    aspectRatio: '4:5',
  },
  {
    key: 'skincare',
    src: '/imgs/generated/example-skincare.jpg',
    prompt:
      'Minimal skincare serum bottles arranged on pastel pink stone pedestals with soft shadows, clean beauty product photography',
    aspectRatio: '4:5',
  },
  {
    key: 'mountain',
    src: '/imgs/generated/example-mountain.jpg',
    prompt:
      'Hiker standing on a rocky ridge above a sea of clouds at sunrise, golden light on snowy peaks, epic adventure photography',
    aspectRatio: '4:5',
  },
  {
    key: 'pixel',
    src: '/imgs/generated/example-pixel.jpg',
    prompt:
      'Isometric pixel art of a tiny bakery shop with an awning, plants and a cat on the doorstep, vibrant retro game style',
    aspectRatio: '4:5',
  },
];

/** Placeholder shown in the generator's result panel before a first run. */
export const STUDIO_SAMPLE: ShowcaseItem = {
  key: 'sample',
  src: '/imgs/generated/studio-sample.jpg',
  prompt:
    'Elegant still life of a ceramic vase with dried pampas grass and a linen cloth on a wooden table, soft natural window light, editorial interior photography',
  aspectRatio: '4:5',
};
