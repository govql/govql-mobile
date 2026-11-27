import { useMemo } from 'react';

import { graphql } from '@/gql';
import type { RecentVotesQuery as RecentVotesData } from '@/gql/graphql';
import { useSavedQuery } from '@/hooks/use-saved-query';
import { HOUR } from '@/lib/saved-data';

// A member's 10 most recent roll-call votes, newest first, with how they voted.
// `vote_positions` has no date, so this filters `votes` to ones the member took part in.
// Measured 2026-11-25: ~0.1–0.2 s per request.
const RecentVotesQuery = graphql(`
  query RecentVotes($id: String!) {
    allVotes(
      filter: { votePositionsByVoteId: { some: { bioguideId: { equalTo: $id } } } }
      orderBy: VOTED_AT_DESC
      first: 10
    ) {
      nodes {
        voteId
        chamber
        votedAt
        question
        result
        sourceUrl
        votePositionsByVoteId(condition: { bioguideId: $id }) {
          nodes {
            position
          }
        }
      }
    }
  }
`);

// New votes come in most days Congress sits, so saved votes are reused for an hour.
const MAX_AGE = HOUR;

function isVotesData(data: unknown): data is RecentVotesData {
  return Array.isArray((data as RecentVotesData | null)?.allVotes?.nodes);
}

export type RecentVote = {
  voteId: string;
  chamber: string | null;
  votedAt: string | null;
  question: string;
  result: string | null;
  sourceUrl: string | null;
  /** As stored, e.g. "Yea", "Aye", "Not Voting". Use positionLabel() to show it. */
  position: string | null;
};

export function useRecentVotes(bioguideId: string) {
  // Saved per member, e.g. under "votes:B001261:…".
  const { data, fetching, error, refreshFailed, savedAt, refetch } = useSavedQuery({
    query: RecentVotesQuery,
    variables: { id: bioguideId },
    name: `votes:${bioguideId}`,
    maxAgeMs: MAX_AGE,
    isValid: isVotesData,
    pause: !bioguideId,
  });

  const votes = useMemo<RecentVote[]>(() => {
    const nodes = data?.allVotes?.nodes ?? [];
    return nodes.flatMap((node) => {
      if (!node) return [];
      return [
        {
          voteId: node.voteId,
          chamber: node.chamber ?? null,
          votedAt: node.votedAt ?? null,
          question: node.question?.trim() || 'Question not recorded',
          result: node.result ?? null,
          sourceUrl: node.sourceUrl ?? null,
          position: node.votePositionsByVoteId.nodes[0]?.position ?? null,
        },
      ];
    });
  }, [data]);

  return { votes, loading: fetching, error, refreshFailed, savedAt, refetch };
}
