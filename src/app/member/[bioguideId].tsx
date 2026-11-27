import { Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState, SavedDataNotice } from '@/components/screen-states';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCurrentMembers } from '@/hooks/use-current-members';
import { useRecentVotes, type RecentVote } from '@/hooks/use-recent-votes';
import { useTheme } from '@/hooks/use-theme';
import { isDelegate, seatLabel, type Member } from '@/lib/members';
import { formatVoteDate, positionLabel } from '@/lib/votes';

// Member screen: who they are (from the cached members list, no extra request) and their
// 10 most recent roll-call votes (one request).
export default function MemberScreen() {
  const theme = useTheme();
  const { bioguideId } = useLocalSearchParams<{ bioguideId: string }>();
  const { members, loading: membersLoading } = useCurrentMembers();
  const member = members.find((m) => m.bioguideId === bioguideId);
  const { votes, loading, error, refreshFailed, savedAt, refetch } = useRecentVotes(bioguideId);

  if (!member) {
    return membersLoading ? (
      <LoadingState label="Loading member…" />
    ) : (
      <EmptyState
        title="Member not found"
        message="This person isn’t in the current Congress, or the link is out of date."
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: member.name }} />
      <FlatList
        data={votes}
        keyExtractor={(vote) => vote.voteId}
        renderItem={({ item }) => <VoteRow vote={item} />}
        ListHeaderComponent={
          <>
            {refreshFailed && savedAt !== null ? <SavedDataNotice savedAt={savedAt} /> : null}
            <MemberHeader member={member} />
          </>
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState label="Loading recent votes…" />
          ) : error ? (
            <ErrorState
              message="Couldn’t load recent votes. Check your connection and try again."
              detail={error.message}
              onRetry={refetch}
            />
          ) : isDelegate(member) ? (
            <EmptyState
              title="No roll-call votes"
              message="Delegates and the Resident Commissioner can’t vote on bills on the House floor, so they have no roll-call votes to show. They can vote in committee."
            />
          ) : (
            <EmptyState title="No recorded votes yet" />
          )
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
        )}
        onRefresh={refetch}
        refreshing={loading && votes.length > 0}
        // The stack header and home indicator set the insets (iOS 26 headers are transparent).
        contentInsetAdjustmentBehavior="automatic"
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </>
  );
}

function MemberHeader({ member }: { member: Member }) {
  return (
    <View style={styles.header}>
      <ThemedText type="subtitle">{member.name}</ThemedText>
      <ThemedText themeColor="textSecondary">
        {seatLabel(member)} · {member.party}
      </ThemedText>
      <ThemedText type="smallBold" accessibilityRole="header" style={styles.sectionTitle}>
        Recent votes
      </ThemedText>
    </View>
  );
}

function VoteRow({ vote }: { vote: RecentVote }) {
  const theme = useTheme();
  const { sourceUrl } = vote;
  const position = positionLabel(vote.position);
  const content = (
    <>
      <ThemedText type="small" themeColor="textSecondary">
        {formatVoteDate(vote.votedAt)}
      </ThemedText>
      {/* The vote's own question text, not a paraphrase (see task 0004, "Neutral wording"). */}
      <ThemedText type="small">{vote.question}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Result: {vote.result ?? 'Not recorded'}
      </ThemedText>
      <ThemedText type="smallBold">Voted: {position}</ThemedText>
      {sourceUrl ? (
        <ThemedText type="small" style={{ color: theme.accent }}>
          Official record ›
        </ThemedText>
      ) : null}
    </>
  );

  if (!sourceUrl) return <View style={styles.row}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${formatVoteDate(vote.votedAt)}. ${vote.question}. Result: ${vote.result ?? 'not recorded'}. Voted: ${position}. Opens the official record.`}
      onPress={() => WebBrowser.openBrowserAsync(sourceUrl)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundSelected }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  listContent: {
    paddingBottom: Spacing.four,
  },
  header: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  sectionTitle: {
    paddingTop: Spacing.three,
  },
  row: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.three,
  },
});
