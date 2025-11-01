const config = {
  verbose: true,
  moduleFileExtensions: ["js", "json", "ts", "node"],
  rootDir: ".",
  globalSetup: "<rootDir>/test/global-setup.ts",
  testEnvironment: "node",
  testRegex: ".spec.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  moduleNameMapper: {
    "^src/(.*)": "<rootDir>/src/$1",
  },
  testTimeout: 30000,
};

export default config;
