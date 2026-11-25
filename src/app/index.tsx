import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import { MemberRow } from '@/components/member-row';
import { EmptyState, ErrorState, LoadingState } from '@/components/screen-states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCurrentMembers } from '@/hooks/use-current-members';
import { useTheme } from '@/hooks/use-theme';
import { groupByChamber, matchesSearch } from '@/lib/members';

// Home: every currently serving member, in Senate and House sections, searchable by name or
// state. All filtering happens on the device; the list is fetched once.
export default function HomeScreen() {
  const theme = useTheme();
  const { members, totalCount, loading, error, refetch } = useCurrentMembers();
  const [query, setQuery] = useState('');

  const sections = useMemo(
    () => groupByChamber(members.filter((member) => matchesSearch(member, query))),
    [members, query]
  );

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

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: 'Search by name or state',
            onChangeText: (event) => setQuery(event.nativeEvent.text),
            onCancelButtonPress: () => setQuery(''),
          },
        }}
      />
      <SectionList
        sections={sections}
        keyExtractor={(member) => member.bioguideId}
        renderItem={({ item }) => <MemberRow member={item} />}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold" accessibilityRole="header">
              {section.title} · {section.data.length}
            </ThemedText>
          </View>
        )}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
        )}
        ListHeaderComponent={
          query ? undefined : (
            <ThemedText type="small" themeColor="textSecondary" style={styles.listHeader}>
              {totalCount} members currently serving
            </ThemedText>
          )
        }
        ListEmptyComponent={
          query ? (
            <EmptyState
              title={`No members match “${query.trim()}”`}
              message="Try a last name, a state name such as Ohio, or a state code such as OH."
            />
          ) : (
            <EmptyState title="No members found" message="Pull down to try again." />
          )
        }
        onRefresh={refetch}
        refreshing={loading}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled
        // The stack header and home indicator set the insets (iOS 26 headers are transparent).
        contentInsetAdjustmentBehavior="automatic"
        style={styles.list}
      />
    </ThemedView>
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
  listHeader: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.three,
  },
});
