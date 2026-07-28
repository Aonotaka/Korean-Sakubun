const assert = require('assert');
const { validateRegistrationInput } = require('../server');

const cases = [
  {
    label: 'rejects short name',
    input: { name: 'A', email: 'a@example.com', userId: 'abc', password: 'Abc12345!' },
    expected: false,
  },
  {
    label: 'rejects weak password',
    input: { name: 'Test User', email: 'a@example.com', userId: 'abc', password: 'password' },
    expected: false,
  },
  {
    label: 'accepts strong registration',
    input: { name: 'Test User', email: 'a@example.com', userId: 'test-user', password: 'StrongPass123!' },
    expected: true,
  },
];

for (const testCase of cases) {
  const result = validateRegistrationInput(testCase.input);
  assert.strictEqual(result.isValid, testCase.expected, testCase.label);
}

console.log('auth validation tests passed');
