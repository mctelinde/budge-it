/**
 * Decodes HTML entities (e.g. &amp; → &, &lt; → <) using the browser's DOMParser.
 */
export const decodeHtmlEntities = (text: string): string => {
  if (!text) return text;
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.documentElement.textContent ?? text;
};
