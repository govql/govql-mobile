// Which Congress is which. No React, no network. Unit-tested in __tests__/.

/**
 * The Congress in session on a date (YYYY-MM-DD). Each Congress starts on Jan 3 of an odd
 * year: the 1st began in 1789, the 119th on 2025-01-03, the 120th on 2027-01-03.
 */
export function congressForDate(isoDate: string): number {
  const year = Number(isoDate.slice(0, 4));
  const monthDay = isoDate.slice(5, 10);
  // Jan 1–2 of an odd year still belong to the previous Congress.
  const effectiveYear = year % 2 === 1 && monthDay < '01-03' ? year - 1 : year;
  return Math.floor((effectiveYear - 1789) / 2) + 1;
}

/**
 * The Congress that GovQL's current-member data describes, taken from House members' term
 * start dates (House terms start with each Congress, or at a special election during it).
 * Uses the most common value, so a few odd dates don't matter. Null if there's no data.
 */
export function congressOfHouseTerms(termStarts: readonly (string | null)[]): number | null {
  const counts = new Map<number, number>();
  for (const start of termStarts) {
    if (!start) continue;
    const congress = congressForDate(start);
    counts.set(congress, (counts.get(congress) ?? 0) + 1);
  }
  let best: number | null = null;
  let bestCount = 0;
  for (const [congress, count] of counts) {
    if (count > bestCount || (count === bestCount && best !== null && congress > best)) {
      best = congress;
      bestCount = count;
    }
  }
  return best;
}

/** "119th", "120th", "121st", "122nd", "123rd". */
export function ordinal(n: number): string {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
