import { useMemo } from 'react';

import { graphql } from '@/gql';
import type { CurrentMembersQuery as CurrentMembersData } from '@/gql/graphql';
import { useSavedQuery } from '@/hooks/use-saved-query';
import { congressOfHouseTerms } from '@/lib/congress';
import { membersFromLegislators, type Member } from '@/lib/members';
import { HOUR } from '@/lib/saved-data';

// Every member whose latest term ends after today (about 540 people), in one request.
const CurrentMembersQuery = graphql(`
  query CurrentMembers($today: Date!) {
    allLegislators(
      filter: { legislatorTermsByBioguideId: { some: { endDate: { greaterThan: $today } } } }
    ) {
      totalCount
      nodes {
        bioguideId
        officialFull
        firstName
        lastName
        legislatorTermsByBioguideIdList(orderBy: END_DATE_DESC, first: 1) {
          termType
          party
          state
          district
          startDate
          endDate
        }
      }
    }
  }
`);

// Membership changes a few times a year, so a saved list is reused for a day.
const MAX_AGE = 24 * HOUR;

function isMembersData(data: unknown): data is CurrentMembersData {
  return Array.isArray((data as CurrentMembersData | null)?.allLegislators?.nodes);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useCurrentMembers() {
  const today = useMemo(() => todayIso(), []);
  // Saved under a fixed name, not by `today`, so yesterday's list is still found.
  const { data, fetching, error, refreshFailed, savedAt, refetch } = useSavedQuery({
    query: CurrentMembersQuery,
    variables: { today },
    name: 'members',
    maxAgeMs: MAX_AGE,
    isValid: isMembersData,
  });

  // Re-checks every term against today, so a saved list never shows someone whose term ended.
  const members = useMemo<Member[]>(
    () => membersFromLegislators(data?.allLegislators?.nodes ?? [], today),
    [data, today]
  );

  // Which Congress this data describes, from House term start dates. District lookups
  // must use the Census map for this Congress, not whichever map is newest.
  const congress = useMemo(
    () => congressOfHouseTerms(members.filter((m) => m.chamber === 'house').map((m) => m.termStart)),
    [members]
  );

  return {
    members,
    congress,
    today,
    // Counted after the term check, so it matches the list shown.
    totalCount: members.length,
    loading: fetching,
    error,
    refreshFailed,
    savedAt,
    refetch,
  };
}
