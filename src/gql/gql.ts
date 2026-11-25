/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query CurrentMembers($today: Date!) {\n    allLegislators(\n      filter: { legislatorTermsByBioguideId: { some: { endDate: { greaterThan: $today } } } }\n    ) {\n      totalCount\n      nodes {\n        bioguideId\n        officialFull\n        firstName\n        lastName\n        legislatorTermsByBioguideIdList(orderBy: END_DATE_DESC, first: 1) {\n          termType\n          party\n          state\n          district\n          endDate\n        }\n      }\n    }\n  }\n": typeof types.CurrentMembersDocument,
    "\n  query RecentVotes($id: String!) {\n    allVotes(\n      filter: { votePositionsByVoteId: { some: { bioguideId: { equalTo: $id } } } }\n      orderBy: VOTED_AT_DESC\n      first: 10\n    ) {\n      nodes {\n        voteId\n        chamber\n        votedAt\n        question\n        result\n        sourceUrl\n        votePositionsByVoteId(condition: { bioguideId: $id }) {\n          nodes {\n            position\n          }\n        }\n      }\n    }\n  }\n": typeof types.RecentVotesDocument,
};
const documents: Documents = {
    "\n  query CurrentMembers($today: Date!) {\n    allLegislators(\n      filter: { legislatorTermsByBioguideId: { some: { endDate: { greaterThan: $today } } } }\n    ) {\n      totalCount\n      nodes {\n        bioguideId\n        officialFull\n        firstName\n        lastName\n        legislatorTermsByBioguideIdList(orderBy: END_DATE_DESC, first: 1) {\n          termType\n          party\n          state\n          district\n          endDate\n        }\n      }\n    }\n  }\n": types.CurrentMembersDocument,
    "\n  query RecentVotes($id: String!) {\n    allVotes(\n      filter: { votePositionsByVoteId: { some: { bioguideId: { equalTo: $id } } } }\n      orderBy: VOTED_AT_DESC\n      first: 10\n    ) {\n      nodes {\n        voteId\n        chamber\n        votedAt\n        question\n        result\n        sourceUrl\n        votePositionsByVoteId(condition: { bioguideId: $id }) {\n          nodes {\n            position\n          }\n        }\n      }\n    }\n  }\n": types.RecentVotesDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CurrentMembers($today: Date!) {\n    allLegislators(\n      filter: { legislatorTermsByBioguideId: { some: { endDate: { greaterThan: $today } } } }\n    ) {\n      totalCount\n      nodes {\n        bioguideId\n        officialFull\n        firstName\n        lastName\n        legislatorTermsByBioguideIdList(orderBy: END_DATE_DESC, first: 1) {\n          termType\n          party\n          state\n          district\n          endDate\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query CurrentMembers($today: Date!) {\n    allLegislators(\n      filter: { legislatorTermsByBioguideId: { some: { endDate: { greaterThan: $today } } } }\n    ) {\n      totalCount\n      nodes {\n        bioguideId\n        officialFull\n        firstName\n        lastName\n        legislatorTermsByBioguideIdList(orderBy: END_DATE_DESC, first: 1) {\n          termType\n          party\n          state\n          district\n          endDate\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RecentVotes($id: String!) {\n    allVotes(\n      filter: { votePositionsByVoteId: { some: { bioguideId: { equalTo: $id } } } }\n      orderBy: VOTED_AT_DESC\n      first: 10\n    ) {\n      nodes {\n        voteId\n        chamber\n        votedAt\n        question\n        result\n        sourceUrl\n        votePositionsByVoteId(condition: { bioguideId: $id }) {\n          nodes {\n            position\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query RecentVotes($id: String!) {\n    allVotes(\n      filter: { votePositionsByVoteId: { some: { bioguideId: { equalTo: $id } } } }\n      orderBy: VOTED_AT_DESC\n      first: 10\n    ) {\n      nodes {\n        voteId\n        chamber\n        votedAt\n        question\n        result\n        sourceUrl\n        votePositionsByVoteId(condition: { bioguideId: $id }) {\n          nodes {\n            position\n          }\n        }\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;