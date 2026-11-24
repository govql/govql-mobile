// Display helpers for members of Congress. Task 0003 adds unit tests and grows these.

export type Chamber = 'house' | 'senate';

export type Member = {
  bioguideId: string;
  name: string;
  chamber: Chamber;
  party: string;
  state: string;
  /** House district; 0 for at-large seats and delegates; null for senators. */
  district: number | null;
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
