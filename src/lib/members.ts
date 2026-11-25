// Plain helpers for members of Congress: no React, no network. Unit-tested in __tests__/.

export type Chamber = 'house' | 'senate';

export type Member = {
  bioguideId: string;
  name: string;
  /** Used for sorting senators; may be empty if the API has no last name. */
  lastName: string;
  chamber: Chamber;
  party: string;
  state: string;
  /** House district; 0 for at-large seats and delegates; null for senators. */
  district: number | null;
};

/** A term as the API returns it (fields may be missing). */
export type TermInput = {
  termType?: string | null;
  party?: string | null;
  state?: string | null;
  district?: number | null;
  endDate?: string | null;
};

/** A legislator as the API returns it, with their terms. */
export type LegislatorInput = {
  bioguideId: string;
  officialFull?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  terms: readonly (TermInput | null)[];
};

/** DC and the territories send a non-voting Delegate (Puerto Rico: a Resident Commissioner). */
const DELEGATE_TITLES: Record<string, string> = {
  DC: 'Delegate',
  GU: 'Delegate',
  VI: 'Delegate',
  AS: 'Delegate',
  MP: 'Delegate',
  PR: 'Resident Commissioner',
};

/** True for DC's and the territories' non-voting House members. */
export function isDelegate(member: Pick<Member, 'chamber' | 'state'>): boolean {
  return member.chamber === 'house' && member.state in DELEGATE_TITLES;
}

export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia', PR: 'Puerto Rico', GU: 'Guam', VI: 'U.S. Virgin Islands',
  AS: 'American Samoa', MP: 'Northern Mariana Islands',
};

export function displayName(person: {
  officialFull?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  const full = person.officialFull?.trim();
  if (full) return full;
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || 'Name unavailable';
}

/** e.g. "Senator, WY", "Representative, TX-7", "Representative, WY at-large", "Delegate, DC". */
export function seatLabel(member: Pick<Member, 'chamber' | 'state' | 'district'>): string {
  if (member.chamber === 'senate') return `Senator, ${member.state}`;
  // Check territories first: delegates are stored with district 0, like at-large seats.
  const delegateTitle = DELEGATE_TITLES[member.state];
  if (delegateTitle) return `${delegateTitle}, ${member.state}`;
  if (member.district === 0 || member.district === null) {
    return `Representative, ${member.state} at-large`;
  }
  return `Representative, ${member.state}-${member.district}`;
}

/**
 * The term that is current on `today` (YYYY-MM-DD): the one ending latest, if it ends
 * after today. Returns null for someone no longer serving.
 */
export function currentTerm(
  terms: readonly (TermInput | null)[],
  today: string
): TermInput | null {
  let latest: TermInput | null = null;
  for (const term of terms) {
    if (!term?.endDate || term.endDate <= today) continue;
    if (!latest || term.endDate > (latest.endDate ?? '')) latest = term;
  }
  return latest;
}

/** API legislator → app Member, or null if they have no current term on `today`. */
export function toMember(legislator: LegislatorInput, today: string): Member | null {
  const term = currentTerm(legislator.terms, today);
  if (!term) return null;
  return {
    bioguideId: legislator.bioguideId,
    name: displayName(legislator),
    lastName: legislator.lastName?.trim() ?? '',
    chamber: term.termType === 'sen' ? 'senate' : 'house',
    party: term.party ?? 'Party unknown',
    state: term.state ?? '',
    district: term.district ?? null,
  };
}

/** Lowercase and strip accents, so "jose" matches "José". */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** True if the query matches the member's name, state name, or two-letter state code. */
export function matchesSearch(member: Member, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  if (normalize(member.name).includes(q)) return true;
  if (normalize(STATE_NAMES[member.state] ?? '').includes(q)) return true;
  return q.length === 2 && member.state.toLowerCase() === q;
}

export type MemberSection = { title: string; chamber: Chamber; data: Member[] };

/**
 * Senate then House. Each sorted by state name; senators then by last name, House members
 * by district. Empty sections are left out.
 */
export function groupByChamber(members: readonly Member[]): MemberSection[] {
  const byState = (a: Member, b: Member) =>
    (STATE_NAMES[a.state] ?? a.state).localeCompare(STATE_NAMES[b.state] ?? b.state);

  const senate = members
    .filter((m) => m.chamber === 'senate')
    .sort((a, b) => byState(a, b) || a.lastName.localeCompare(b.lastName));
  const house = members
    .filter((m) => m.chamber === 'house')
    .sort((a, b) => byState(a, b) || (a.district ?? 0) - (b.district ?? 0));

  const sections: MemberSection[] = [
    { title: 'Senate', chamber: 'senate', data: senate },
    { title: 'House', chamber: 'house', data: house },
  ];
  return sections.filter((section) => section.data.length > 0);
}
