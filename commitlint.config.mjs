// Header format: type(scope): description DEV-10xx  (scope and ticket are required).
const TICKET_SUFFIX = / DEV-\d{4}$/;

export default {
  extends: ['@commitlint/config-conventional'],
  parserPreset: { parserOpts: { issuePrefixes: ['DEV-'] } },
  plugins: [
    {
      rules: {
        'header-ticket-suffix': ({ header }) => [
          TICKET_SUFFIX.test(header ?? ''),
          'header must end with a ticket id: type(scope): description DEV-10xx',
        ],
      },
    },
  ],
  rules: {
    'scope-empty': [2, 'never'],
    'references-empty': [2, 'never'],
    'header-ticket-suffix': [2, 'always'],
  },
};
