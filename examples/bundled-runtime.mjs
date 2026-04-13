#!/usr/bin/env node

import { createBundledRuntimeServer } from './lib/bundled-runtime-server.mjs';
import { BUNDLED_RUNTIME_PORT } from './lib/bundled-runtime-profile.mjs';

const port = Number(process.env.PORT || process.argv[2] || BUNDLED_RUNTIME_PORT);
const server = createBundledRuntimeServer();

server.listen(port, '127.0.0.1', () => {
  console.log(`[bundled-runtime] listening on http://127.0.0.1:${port}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
