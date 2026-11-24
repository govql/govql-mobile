import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCurrentMembers } from '@/hooks/use-current-members';
import { seatLabel, type Member } from '@/lib/members';

// Task 0001: a plain list proving the data path. Task 0003 turns it into the finished
// home screen (House/Senate sections, search, tap through to a member).
export default function HomeScreen() {
  const { members, totalCount, loading, error, refetch } = useCurrentMembers();

  if (loading && members.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
        <ThemedText type="small">Loading members of Congress…</ThemedText>
      </ThemedView>
    );
  }

  if (error && members.length === 0) {
    return (
      <ThemedView style={[styles.centered, { paddingHorizontal: Spacing.four }]}>
        <ThemedText style={styles.textCenter}>
          Couldn’t load members of Congress. Check your connection and try again.
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.textCenter}>
          {error.message}
        </ThemedText>
        <Pressable accessibilityRole="button" onPress={refetch} style={styles.retry}>
          <ThemedText type="smallBold">Try again</ThemedText>
        </Pressable>
      </ThemedView>
    );
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
          <View style={styles.header}>
            <ThemedText type="subtitle">Current Congress</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {totalCount} members currently serving
            </ThemedText>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </ThemedView>
  );
}

function MemberRow({ member }: { member: Member }) {
  return (
    <View style={styles.row}>
      <ThemedText type="smallBold">{member.name}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {seatLabel(member)} · {member.party}
      </ThemedText>
    </View>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  textCenter: {
    textAlign: 'center',
  },
  retry: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  header: {
    gap: Spacing.one,
    paddingBottom: Spacing.three,
  },
  row: {
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#8888',
  },
});
