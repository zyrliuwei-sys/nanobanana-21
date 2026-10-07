/**
 * Serialize JSON-LD for a <script type="application/ld+json"> tag.
 * `<` is escaped so content (e.g. a blog title from the database) can never
 * close the script element (`</script>` breakout).
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
