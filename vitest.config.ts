import { defineConfig } from 'vitest/config';

// Root script tests also cover the MCP entry point, which has no package test config.
// Other per-package tests keep their own configs.
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['scripts/**/*.test.ts', 'packages/mcp-server/test/**/*.test.ts'],
  },
});
