/** One reading-time estimate for article cards and the reader itself. */
export function estimateReadingMinutes(html) {
  const text = html
    .replace(/<!-- READER-END:START -->[\s\S]*?<!-- READER-END:END -->/g, ' ')
    .replace(/<details\b[^>]*class="[^"]*reading-toc[^"]*"[^>]*>[\s\S]*?<\/details>/g, ' ')
    .replace(/<div\b[^>]*class="next"[^>]*>[\s\S]*?<\/div>/g, ' ')
    .replace(/<(script|style|svg|annotation)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&#?\w+;/g, ' ')
    .replace(/\s+/g, ' ').trim();
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 220));
}
