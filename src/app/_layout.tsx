import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Provider as UrqlProvider } from 'urql';

import { graphqlClient } from '@/lib/graphql-client';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <UrqlProvider value={graphqlClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Congress' }} />
          {/* The member screen sets its own title once it knows the member's name. */}
          <Stack.Screen name="member/[bioguideId]" options={{ title: 'Member' }} />
        </Stack>
      </ThemeProvider>
    </UrqlProvider>
  );
}
