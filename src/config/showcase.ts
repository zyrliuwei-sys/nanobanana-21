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
      'High-fashion editorial of a model in a tailored ivory wool coat walking a rain-slicked Paris street at night, cinematic reflections',
    aspectRatio: '4:5',
  },
  {
    key: 'food',
    src: '/imgs/generated/showcase-food.jpg',
    prompt:
      'Fine-dining plate of seared scallops with microgreens and beurre blanc on a matte black ceramic plate, moody Michelin restaurant lighting',
    aspectRatio: '4:5',
  },
  {
    key: 'anime',
    src: '/imgs/generated/showcase-jewelry.jpg',
    prompt:
      'Close-up of a delicate gold necklace with an emerald pendant draped over white silk, soft window light, luxury jewelry photography',
    aspectRatio: '4:5',
  },
  {
    key: 'architecture',
    src: '/imgs/generated/showcase-architecture.jpg',
    prompt:
      'Minimalist luxury villa with an infinity pool overlooking the sea at blue hour, warm interior lights, architectural photography',
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
    src: '/imgs/generated/showcase-watch.jpg',
    prompt:
      'Close-up of a luxury steel chronograph wristwatch resting on dark walnut wood, soft directional light, macro detail of brushed steel, high-end advertising',
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
      'Specialty pour-over coffee setup with a glass carafe on a walnut bar counter, soft morning light',
    aspectRatio: '4:5',
  },
  {
    key: 'sushi',
    src: '/imgs/generated/example-sushi.jpg',
    prompt:
      'Omakase sushi nigiri on a black slate counter, chef hands placing fresh tuna, intimate Tokyo restaurant',
    aspectRatio: '4:5',
  },
  {
    key: 'sneaker',
    src: '/imgs/generated/example-sneaker.jpg',
    prompt:
      'Luxury white leather sneaker on polished concrete, soft studio light, clean minimal product shot',
    aspectRatio: '4:5',
  },
  {
    key: 'venice',
    src: '/imgs/generated/example-venice.jpg',
    prompt:
      'Venice Grand Canal at sunset seen from a gondola, golden light on historic palazzi, cinematic travel photography',
    aspectRatio: '4:5',
  },
  {
    key: 'car',
    src: '/imgs/generated/example-car.jpg',
    prompt:
      'Sleek silver sports car with no logos on a coastal mountain road at dusk, motion blur, automotive advertising',
    aspectRatio: '4:5',
  },
  {
    key: 'skincare',
    src: '/imgs/generated/example-skincare.jpg',
    prompt:
      'Minimal skincare serum bottles arranged on travertine blocks with soft shadows, clean beauty photography',
    aspectRatio: '4:5',
  },
  {
    key: 'mountain',
    src: '/imgs/generated/example-mountain.jpg',
    prompt:
      'Hiker standing on a rocky ridge above a sea of clouds at sunrise, golden light on snowy peaks',
    aspectRatio: '4:5',
  },
  {
    key: 'peonies',
    src: '/imgs/generated/example-peonies.jpg',
    prompt:
      'Bouquet of white peonies in a ceramic vase against a dark background, Dutch master style lighting, fine-art still life',
    aspectRatio: '4:5',
  },
];

/** Placeholder shown in the generator's result panel before a first run. */
export const STUDIO_SAMPLE: ShowcaseItem = {
  key: 'sample',
  src: '/imgs/generated/studio-sample.jpg',
  prompt:
    'Fashion model in a sculptural white gown standing in desert dunes at golden hour, wind in the fabric',
  aspectRatio: '4:5',
};
