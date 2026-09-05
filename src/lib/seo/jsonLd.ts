/**
 * Serialize a JSON-LD payload for `dangerouslySetInnerHTML` without letting it break out of its
 * own `<script type="application/ld+json">` tag.
 *
 * `JSON.stringify` does not escape `<`, so a data value containing the literal text `</script>`
 * closes the script element early once it reaches the HTML parser — the same escape
 * `src/app/[companySlug]/CompanyLandingPageClient.tsx`'s local `sanitizeForJsonLd()` applies
 * per-field. Applied here to the whole serialized string instead, so a caller does not need to
 * remember to sanitize every field it adds to a schema object.
 */
export function toJsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--');
}
