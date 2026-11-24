import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/components/screen-states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCurrentMembers } from '@/hooks/use-current-members';
import { useTheme } from '@/hooks/use-theme';
import { seatLabel, type Member } from '@/lib/members';

// Home: every currently serving member, as a plain list. Task 0003 adds House/Senate
// sections and search.
export default function HomeScreen() {
  const theme = useTheme();
  const { members, totalCount, loading, error, refetch } = useCurrentMembers();

  if (loading && members.length === 0) {
    return <LoadingState label="Loading members of Congress…" />;
  }

  if (error && members.length === 0) {
    return (
      <ErrorState
        message="Couldn’t load members of Congress. Check your connection and try again."
        detail={error.message}
        onRetry={refetch}
      />
    );
  }

  if (members.length === 0) {
    return <EmptyState title="No members found" message="Pull down to try again." />;
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={members}
        keyExtractor={(member) => member.bioguideId}
        renderItem={({ item }) => <MemberRow member={item} />}
        onRefresh={refetch}
        refreshing={loading}
        style={styles.list}
        // The stack header and home indicator set the insets (iOS 26 headers are transparent).
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <ThemedText type="small" themeColor="textSecondary" style={styles.header}>
            {totalCount} members currently serving
          </ThemedText>
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
        )}
      />
    </ThemedView>
  );
}

function MemberRow({ member }: { member: Member }) {
  const theme = useTheme();
  const seat = `${seatLabel(member)} · ${member.party}`;
  return (
    <Link href={{ pathname: '/member/[bioguideId]', params: { bioguideId: member.bioguideId } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${member.name}, ${seat}`}
        style={({ pressed }) => [
          styles.row,
          pressed && { backgroundColor: theme.backgroundSelected },
        ]}>
        <ThemedText type="smallBold">{member.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {seat}
        </ThemedText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  listContent: {
    padding: Spacing.three,
  },
  header: {
    paddingBottom: Spacing.two,
  },
  row: {
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
