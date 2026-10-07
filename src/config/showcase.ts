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

export const SHOWCASE: ShowcaseItem[] = [
  {
    key: 'portrait',
    src: '/imgs/showcase/portrait.jpg',
    prompt:
      'Editorial portrait of a young woman with freckles in golden hour light, natural skin texture, shallow depth of field, shot on 85mm',
    aspectRatio: '4:5',
  },
  {
    key: 'product',
    src: '/imgs/showcase/product.jpg',
    prompt:
      'Luxury perfume bottle standing on wet black volcanic rocks, lime green rim light, water droplets, studio product photography',
    aspectRatio: '4:5',
  },
  {
    key: 'fashion',
    src: '/imgs/showcase/fashion.jpg',
    prompt:
      'Fashion model in an oversized neon lime jacket on a rainy Tokyo street at night, cinematic reflections',
    aspectRatio: '4:5',
  },
  {
    key: 'food',
    src: '/imgs/showcase/food.jpg',
    prompt:
      'Overhead shot of a ramen bowl with a soft-boiled egg, rising steam, dark slate table, moody food photography',
    aspectRatio: '4:5',
  },
  {
    key: 'anime',
    src: '/imgs/showcase/anime.jpg',
    prompt:
      'Anime-style girl riding a bicycle through a sunflower field under a vivid summer sky, hand-painted look',
    aspectRatio: '4:5',
  },
  {
    key: 'architecture',
    src: '/imgs/showcase/architecture.jpg',
    prompt:
      'Futuristic white museum with a curved concrete facade at blue hour, architectural photography',
    aspectRatio: '4:5',
  },
  {
    key: 'landscape',
    src: '/imgs/showcase/landscape.jpg',
    prompt:
      'Aerial view of a turquoise lagoon and a white sand island, ultra-detailed 4K landscape photography',
    aspectRatio: '4:5',
  },
  {
    key: 'character',
    src: '/imgs/showcase/character.jpg',
    prompt:
      'Cute 3D clay character of a banana astronaut floating in space, soft lighting, Pixar-style render',
    aspectRatio: '4:5',
  },
];
