// Vercel runs this file as an ES module, so we load the bundled server app the same way.
const { createApp } = await import('../.serverless/server-app.mjs') as typeof import('../src/server/app');
const app = createApp();

export default app;
