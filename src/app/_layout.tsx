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
          <Stack.Screen name="my-members" options={{ title: 'My members' }} />
          <Stack.Screen name="choose-district/index" options={{ title: 'Choose your state' }} />
          {/* Sets its own title (the state's name). */}
          <Stack.Screen name="choose-district/[state]" options={{ title: 'Choose your district' }} />
        </Stack>
      </ThemeProvider>
    </UrqlProvider>
  );
}
