require('@testing-library/jest-dom');

// Suppress React act() warnings in tests
// These warnings occur because Radix UI components and AuthProvider have async state updates
// that happen outside of user interactions, which is normal behavior
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: An update to') &&
    args[0].includes('was not wrapped in act')
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
};
