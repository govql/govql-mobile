import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatSavedAt } from '@/lib/saved-data';

// Full-screen loading, error, and empty states shared by every data screen.

export function LoadingState({ label }: { label: string }) {
  return (
    <ThemedView style={styles.centered}>
      <ActivityIndicator />
      <ThemedText type="small" themeColor="textSecondary" style={styles.textCenter}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

export function ErrorState({
  message,
  detail,
  onRetry,
}: {
  message: string;
  /** Technical detail (e.g. the API's error text), shown smaller beneath the message. */
  detail?: string;
  onRetry?: () => void;
}) {
  const theme = useTheme();
  return (
    <ThemedView style={styles.centered}>
      <ThemedText style={styles.textCenter}>{message}</ThemedText>
      {detail ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.textCenter}>
          {detail}
        </ThemedText>
      ) : null}
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [
            styles.button,
            { borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
          ]}>
          <ThemedText type="smallBold">Try again</ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <ThemedView style={styles.centered}>
      <ThemedText type="smallBold" style={styles.textCenter}>
        {title}
      </ThemedText>
      {message ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.textCenter}>
          {message}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

/** Small, non-blocking notice: a refresh failed, so the screen shows data saved earlier. */
export function SavedDataNotice({ savedAt }: { savedAt: number }) {
  const theme = useTheme();
  return (
    <ThemedText
      type="small"
      themeColor="textSecondary"
      accessibilityLiveRegion="polite"
      style={[styles.notice, { backgroundColor: theme.backgroundElement }]}>
      Couldn’t refresh. Showing data saved on {formatSavedAt(savedAt)}.
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  textCenter: {
    textAlign: 'center',
  },
  notice: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    padding: Spacing.two,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  button: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
});
