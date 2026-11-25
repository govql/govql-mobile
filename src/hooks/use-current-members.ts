import { useMemo } from 'react';
import { useQuery } from 'urql';

import { graphql } from '@/gql';
import { congressOfHouseTerms } from '@/lib/congress';
import { toMember, type Member } from '@/lib/members';

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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useCurrentMembers() {
  const today = useMemo(() => todayIso(), []);
  const [result, reexecute] = useQuery({ query: CurrentMembersQuery, variables: { today } });

  const members = useMemo<Member[]>(() => {
    const nodes = result.data?.allLegislators?.nodes ?? [];
    return nodes.flatMap((node) => {
      if (!node) return [];
      const member = toMember({ ...node, terms: node.legislatorTermsByBioguideIdList }, today);
      return member ? [member] : [];
    });
  }, [result.data, today]);

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
    totalCount: result.data?.allLegislators?.totalCount ?? 0,
    loading: result.fetching,
    error: result.error,
    refetch: () => reexecute({ requestPolicy: 'network-only' }),
  };
}
