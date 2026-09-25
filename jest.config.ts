import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import ts from 'typescript';

// Path aliases (e.g. the ones added by `nest g library`) live in tsconfig.json,
// so they are read from there instead of being duplicated here.
const { config: tsconfig } = ts.readConfigFile(
  './tsconfig.json',
  ts.sys.readFile,
);
const paths = tsconfig?.compilerOptions?.paths ?? {};

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    // Fuerza CommonJS en tests: el tsconfig usa "module": "nodenext" (ESM) y Jest corre en CJS.
    // allowJs para poder transpilar también los .js ESM de @nestjs/* en node_modules.
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          resolvePackageJsonExports: false,
          ignoreDeprecations: '6.0',
          allowJs: true,
        },
      },
    ],
  },
  // Nest 12 es ESM-only (type:module). Con NODE_OPTIONS=--experimental-vm-modules
  // Jest usa require(esm) nativo; NO transformar @nestjs/* (si se transforma a CJS
  // y luego se carga como ESM da "exports is not defined").
  transformIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>/' }),
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    'libs/**/*.(t|j)s',
    'apps/**/*.(t|j)s',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};

export default config;
