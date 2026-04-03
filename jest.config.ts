import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'commonjs',
          moduleResolution: 'node10',
          ignoreDeprecations: '6.0',
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          isolatedModules: true,
          types: ['jest'],
        },
      },
    ],
  },
  collectCoverageFrom: [
    'src/lib/validators/**/*.ts',
    'src/lib/qr.ts',
    'src/lib/geolocation.ts',
    'src/lib/cloudinary.ts',
    'src/lib/routes.ts',
    'src/lib/templates/**/*.ts',
    'src/middleware/**/*.ts',
    'src/services/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFiles: ['./jest.setup.ts'],
};

export default config;
