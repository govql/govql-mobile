import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { placeLabel, seatLabel, type Member } from '@/lib/members';

/**
 * A tappable district: "Texas, District 7" over its member's name, role, and party (or
 * "Vacant seat"). Used wherever the user picks their district.
 */
export function DistrictRow({
  state,
  district,
  member,
  onPress,
}: {
  state: string;
  district: number;
  member: Member | null;
  onPress: () => void;
}) {
  const theme = useTheme();
  const place = placeLabel(state, district);
  const detail = member
    ? `${member.name} · ${seatLabel(member).split(',')[0]} · ${member.party}`
    : 'Vacant seat';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${place}: ${detail}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="smallBold">{place}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {detail}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },
});
