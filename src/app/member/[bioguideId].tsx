import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { EmptyState, LoadingState } from '@/components/screen-states';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useCurrentMembers } from '@/hooks/use-current-members';
import { seatLabel } from '@/lib/members';

// Member screen. Task 0004 adds the member's recent votes. For now it shows who they are,
// read from the current-members list that the home screen has already cached (no new request).
export default function MemberScreen() {
  const { bioguideId } = useLocalSearchParams<'/member/[bioguideId]'>();
  const { members, loading } = useCurrentMembers();
  const member = members.find((m) => m.bioguideId === bioguideId);

  if (!member) {
    return loading ? (
      <LoadingState label="Loading member…" />
    ) : (
      <EmptyState
        title="Member not found"
        message="This person isn’t in the current Congress, or the link is out of date."
      />
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: member.name }} />
      <ThemedText type="subtitle">{member.name}</ThemedText>
      <ThemedText themeColor="textSecondary">
        {seatLabel(member)} · {member.party}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
        Recent votes will appear here.
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  note: {
    paddingTop: Spacing.three,
  },
});
