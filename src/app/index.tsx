import { Link, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';

import { MemberRow } from '@/components/member-row';
import { EmptyState, ErrorState, LoadingState, SavedDataNotice } from '@/components/screen-states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCurrentMembers } from '@/hooks/use-current-members';
import { useTheme } from '@/hooks/use-theme';
import { groupByChamber, matchesSearch, placeLabel } from '@/lib/members';
import { loadSavedDistrict } from '@/lib/saved-district';

// Home: every currently serving member, in Senate and House sections, searchable by name or
// state. All filtering happens on the device; the list is fetched once.
export default function HomeScreen() {
  const theme = useTheme();
  const { members, totalCount, loading, error, refreshFailed, savedAt, refetch } = useCurrentMembers();
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
          <View>
            {refreshFailed && savedAt !== null ? <SavedDataNotice savedAt={savedAt} /> : null}
            {query ? null : (
              <>
                <MyMembersEntry />
                <ThemedText type="small" themeColor="textSecondary" style={styles.listHeader}>
                  {totalCount} members currently serving
                </ThemedText>
              </>
            )}
          </View>
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

/** Card linking to "Find my members", or to the saved district's members. */
function MyMembersEntry() {
  const theme = useTheme();
  const [saved, setSaved] = useState(() => loadSavedDistrict());
  useFocusEffect(
    useCallback(() => {
      setSaved(loadSavedDistrict());
    }, [])
  );

  const title = saved ? 'Your members' : 'Find my members';
  const detail = saved
    ? placeLabel(saved.state, saved.district)
    : 'Use your address or location to see your senators and representative.';

  return (
    <Link href="/my-members" asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${title}. ${detail}`}
        style={({ pressed }) => [
          styles.entry,
          { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
        ]}>
        <ThemedText type="smallBold" style={{ color: theme.accent }}>
          {title} ›
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {detail}
        </ThemedText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  entry: {
    margin: Spacing.three,
    marginBottom: 0,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.half,
  },
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
