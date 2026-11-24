import { Client, cacheExchange, fetchExchange } from 'urql';

// Must be read with this exact dot form: Expo inlines EXPO_PUBLIC_* values at bundle time.
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    'EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env, then reload the app.'
  );
}

export const graphqlClient = new Client({
  url: apiUrl,
  exchanges: [cacheExchange, fetchExchange],
  // The GovQL API only accepts POST; urql otherwise sends short queries as GET.
  preferGetMethod: false,
});
