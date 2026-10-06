/** Deterministic PRNG (mulberry32) so a puzzle generated from a given seed
 * is byte-for-byte identical every time — used to make the daily challenge
 * the same board for every player on a given day. */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Simple string hash (32-bit FNV-ish via imul) turning a date key like
 * "2026-08-13" into a numeric seed for {@link mulberry32}. */
export function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(hash, 31) + str.charCodeAt(i)) | 0;
  }
  return hash;
}
