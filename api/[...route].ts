import { createRequire } from 'node:module';

// Vercel runs this file as an ES module, so we bridge into the bundled CommonJS server app.
const require = createRequire(import.meta.url);
const { createApp } = require('../.serverless/server-app.cjs') as typeof import('../src/server/app');
const app = createApp();

export default app;
