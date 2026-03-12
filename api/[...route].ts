import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createApp } = require('../.serverless/server-app.cjs') as typeof import('../src/server/app');
const app = createApp();

export default app;
