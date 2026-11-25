import type { CodegenConfig } from '@graphql-codegen/cli';

// Reads the live API schema and the app's queries, and writes typed documents to src/gql/.
// Run with `npm run codegen`. Generated files are committed and never edited by hand.
// Node doesn't load .env here, so fall back to the production API (its schema is public).
const schemaUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.govql.us/graphql';

const config: CodegenConfig = {
  schema: schemaUrl,
  documents: ['src/**/*.{ts,tsx}', '!src/gql/**/*', '!src/data/**/*'],
  ignoreNoDocuments: false,
  generates: {
    './src/gql/': {
      preset: 'client',
      presetConfig: { fragmentMasking: false },
      config: {
        useTypeImports: true,
        enumsAsTypes: true,
        // PostGraphile custom scalars arrive as JSON strings.
        scalars: {
          BigInt: 'string',
          BigFloat: 'string',
          Cursor: 'string',
          Date: 'string',
          Datetime: 'string',
        },
      },
    },
  },
};

export default config;
