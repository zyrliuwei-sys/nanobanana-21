function image(name: string) {
  return {
    src: `/imgs/seedream/${name}-1600.jpg`,
    srcSet: `/imgs/seedream/${name}-800.webp 800w, /imgs/seedream/${name}-1600.webp 1600w`,
  };
}

/** Generated creative references, separate from visitors' model outputs. */
export const SEEDREAM_IMAGES = {
  landscape: image('landscape'),
  architecture: image('architecture'),
  portrait: image('portrait'),
  product: image('product'),
};
