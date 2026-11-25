import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { STATE_NAMES } from '@/lib/members';

const STATES = Object.entries(STATE_NAMES)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Step 1 of "Choose my state and district": pick a state (or DC / a territory).
export default function ChooseStateScreen() {
  const theme = useTheme();
  return (
    <FlatList
      data={STATES}
      keyExtractor={(item) => item.code}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.list}
      ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.border }]} />}
      renderItem={({ item }) => (
        <Link href={{ pathname: '/choose-district/[state]', params: { state: item.code } }} asChild>
          <Pressable
            accessibilityRole="link"
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText>{item.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {item.code}
            </ThemedText>
          </Pressable>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.three,
  },
});
