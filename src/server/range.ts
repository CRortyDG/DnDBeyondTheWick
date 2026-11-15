/** A Range header's single byte range, in the shape R2's get() takes. */
export type ByteRange = { offset: number; length?: number } | { suffix: number };

/**
 * The bytes a Range header asks for. null: the whole file. Only one range is
 * read, which is all a video player asks for.
 */
export function parseRange(h: string | null): ByteRange | null {
  const m = h ? /^bytes=(\d*)-(\d*)$/.exec(h.trim()) : null;
  if (!m || (!m[1] && !m[2])) return null;
  if (!m[1]) return { suffix: Number(m[2]) };
  const offset = Number(m[1]);
  return m[2] ? { offset, length: Math.max(0, Number(m[2]) - offset + 1) } : { offset };
}

/** The first and last byte a range covers in a file of this size, or null when it misses the file. */
export function rangeBounds(range: ByteRange, size: number): { start: number; end: number } | null {
  const start = "suffix" in range ? Math.max(0, size - range.suffix) : range.offset;
  const end = "suffix" in range || range.length === undefined ? size - 1 : Math.min(size, start + range.length) - 1;
  return start >= size || end < start ? null : { start, end };
}
