module.exports = {
  //For parsing jsx properly
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }
  },
  //Preset for proper Typescript support
  preset: 'ts-jest',
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@features/(.*)$": "<rootDir>/src/features/$1",
    "^@types/(.*)$": "<rootDir>/src/types/$1",
    "^@hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@lib/(.*)$": "<rootDir>/src/lib/$1"
  },
  // Use ts-jest for TypeScript files only
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },

  // Handled ESM Dependencies (Supabase/jose)
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  transformIgnorePatterns: ["/node_modules/(?!jose)"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
};
