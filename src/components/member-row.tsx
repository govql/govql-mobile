import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { seatLabel, type Member } from '@/lib/members';

/** One member: name, then seat and party as text. Tapping opens the member screen. */
export function MemberRow({ member }: { member: Member }) {
  const theme = useTheme();
  const seat = `${seatLabel(member)} · ${member.party}`;
  return (
    <Link
      href={{ pathname: '/member/[bioguideId]', params: { bioguideId: member.bioguideId } }}
      asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${member.name}, ${seat}`}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">{member.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {seat}
        </ThemedText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    gap: Spacing.half,
  },
});
