import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { DistrictRow } from '@/components/district-row';
import { EmptyState, LoadingState } from '@/components/screen-states';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCurrentMembers } from '@/hooks/use-current-members';
import { useTheme } from '@/hooks/use-theme';
import { congressForDate } from '@/lib/congress';
import { houseMembersInState, STATE_NAMES, type Member } from '@/lib/members';
import { saveDistrict } from '@/lib/saved-district';

// Step 2 of "Choose my state and district": each district with its representative's name,
// since most people know their representative's name better than their district number.
export default function ChooseDistrictScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { state } = useLocalSearchParams<{ state: string }>();
  const { members, congress, today, loading } = useCurrentMembers();
  const stateName = STATE_NAMES[state] ?? state;
  const house = houseMembersInState(members, state);

  const choose = (member: Member) => {
    saveDistrict({ state, district: member.district ?? 0, congress: congress ?? congressForDate(today) });
    router.dismissTo('/my-members');
  };

  if (members.length === 0) {
    return loading ? <LoadingState label="Loading members of Congress…" /> : <EmptyState title="No members found" />;
  }

  return (
    <>
      <Stack.Screen options={{ title: stateName }} />
      <FlatList
        data={house}
        keyExtractor={(m) => m.bioguideId}
        contentInsetAdjustmentBehavior="automatic"
        style={styles.list}
        ListHeaderComponent={
          <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
            {house.length > 1
              ? 'Choose your district. If you’re not sure of the number, look for your representative’s name.'
              : 'Choose your seat.'}
          </ThemedText>
        }
        ListEmptyComponent={<EmptyState title="No House members found for this state" />}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.border }]} />}
        renderItem={({ item }) => (
          <DistrictRow state={item.state} district={item.district ?? 0} member={item} onPress={() => choose(item)} />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  intro: {
    padding: Spacing.three,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.three,
  },
});
