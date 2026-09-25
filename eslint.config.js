import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

// ---------------------------------------------------------------------------
// Architectural boundaries (see ARCHITECTURE.md)
//
//   engine   → nothing (framework-free, subject-agnostic)
//   domains  → engine only (framework-free science); `*/visual/**` may use R3F
//   rendering, simulations, components, state, app → anything below them
// ---------------------------------------------------------------------------
const frameworkImports = [
  { name: 'react', message: 'This layer must stay framework-free.' },
  { name: 'react-dom', message: 'This layer must stay framework-free.' },
  { name: 'three', message: 'This layer must stay framework-free.' },
  { name: 'zustand', message: 'This layer must stay framework-free.' },
]
const frameworkPatterns = [{ group: ['@react-three/*'], message: 'This layer must stay framework-free.' }]
const outerLayers = [
  '@/rendering',
  '@/rendering/*',
  '@/state/*',
  '@/components/*',
  '@/app/*',
  '@/simulations',
  '@/simulations/*',
]

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'playwright-report', 'test-results'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // The Simulation SDK knows nothing about frameworks or any scientific domain.
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: frameworkImports,
          patterns: [
            ...frameworkPatterns,
            {
              group: [...outerLayers, '@/domains', '@/domains/*'],
              message: 'The engine must not depend on outer layers or domains.',
            },
          ],
        },
      ],
    },
  },
  {
    // Domain science is framework-free and never depends on simulations or UI.
    files: ['src/domains/**/*.ts'],
    ignores: ['src/domains/*/visual/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: frameworkImports,
          patterns: [
            ...frameworkPatterns,
            { group: outerLayers, message: 'Domains must not depend on outer layers.' },
          ],
        },
      ],
    },
  },
  {
    // The lab catalogue is plain data plus pure helpers: no frameworks, no UI.
    files: ['src/catalogue/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: frameworkImports,
          patterns: [
            ...frameworkPatterns,
            { group: outerLayers, message: 'The catalogue must not depend on outer layers.' },
          ],
        },
      ],
    },
  },
  {
    // Route tables legitimately mix lazy page components and router config.
    files: ['src/app/router.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // shadcn/ui components co-export their variant helpers by convention.
    files: ['src/components/ui/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // Shared numerical methods serve every domain, so they may depend on none of them.
    files: ['src/lib/numerics/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: frameworkImports,
          patterns: [
            ...frameworkPatterns,
            {
              group: [...outerLayers, '@/domains', '@/domains/*'],
              message: 'Shared numerics must not depend on domains or outer layers.',
            },
          ],
        },
      ],
    },
  },
  {
    // The rendering engine is subject-agnostic: engine and app state only, never a domain or simulation.
    files: ['src/rendering/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/domains',
                '@/domains/*',
                '@/simulations',
                '@/simulations/*',
                '@/components/*',
                '@/app/*',
              ],
              message: 'Rendering must not depend on domains, simulations or UI.',
            },
          ],
        },
      ],
    },
  },
)
