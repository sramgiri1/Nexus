export const REDACTION_FIXTURES = [
  {
    label: "Fake provider key placeholder",
    input: "Use sk-FAKEPLACEHOLDER0000 only as a scanner fixture.",
    shouldFlag: true,
  },
  {
    label: "Allowed activation phrase",
    input: "The sk-activation phrase is documentation-safe.",
    shouldFlag: false,
  },
  {
    label: "Fake bearer token",
    input: "Authorization: Bearer FAKE_PLACEHOLDER_TOKEN_000000",
    shouldFlag: true,
  },
  {
    label: "Fake database URL",
    input: "DATABASE_URL=postgres://placeholder.invalid/db",
    shouldFlag: true,
  },
];
