/**
 * Responsive WebP sources for the bundled showcase/feature JPEGs.
 * Each `/imgs/<dir>/<name>.jpg` has `<name>-400.webp` and `<name>-800.webp`
 * siblings; the JPEG stays as the `src` fallback.
 */
export function webpSrcSet(src: string): string {
  const base = src.replace(/\.jpg$/, '');
  return `${base}-400.webp 400w, ${base}-800.webp 800w`;
}
