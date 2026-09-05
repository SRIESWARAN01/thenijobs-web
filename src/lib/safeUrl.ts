/**
 * Returns `url` if it is safe to hand to `<a href>`, or `undefined` otherwise.
 *
 * React does not sanitize `href` — a stored value like `javascript:fetch(...)` executes in
 * the visitor's own browser, on this site's own origin, the instant they click the link. Every
 * field this guards (a company's website/social links, a seeker's portfolio project/certificate/
 * resume links) is free text the account owner types themselves, with no format validation on
 * write, so any of them can carry that payload today.
 *
 * A bare domain with no scheme (`example.com`) is assumed to mean `https://`, matching how every
 * "Website" field in this app is described to the person typing it. Any other explicit scheme
 * (`javascript:`, `data:`, `vbscript:`, ...) is refused outright.
 */
export function safeExternalUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return undefined;
  return `https://${trimmed}`;
}
