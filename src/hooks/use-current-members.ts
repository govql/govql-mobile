import { useMemo } from 'react';
import { useQuery } from 'urql';

import { graphql } from '@/gql';
import { displayName, type Member } from '@/lib/members';

// Every member whose latest term ends after today (about 540 people), in one request.
const CurrentMembersQuery = graphql(`
  query CurrentMembers($today: Date!) {
    allLegislators(
      filter: { legislatorTermsByBioguideId: { some: { endDate: { greaterThan: $today } } } }
    ) {
      totalCount
      nodes {
        bioguideId
        officialFullBroken
        firstName
        lastName
        legislatorTermsByBioguideIdList(orderBy: END_DATE_DESC, first: 1) {
          termType
          party
          state
          district
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
      const term = node?.legislatorTermsByBioguideIdList[0];
      if (!node || !term) return [];
      return [
        {
          bioguideId: node.bioguideId,
          name: displayName(node),
          chamber: term.termType === 'sen' ? 'senate' : 'house',
          party: term.party ?? 'Party unknown',
          state: term.state ?? '',
          district: term.district ?? null,
        },
      ];
    });
  }, [result.data]);

  return {
    members,
    totalCount: result.data?.allLegislators?.totalCount ?? 0,
    loading: result.fetching,
    error: result.error,
    refetch: () => reexecute({ requestPolicy: 'network-only' }),
  };
}
