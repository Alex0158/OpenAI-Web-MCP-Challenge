import { createApp } from "../src/app";

// Vercel invokes the Express application as a Node.js function. The local
// process entrypoint remains src/index.ts, where app.listen() is owned.
export { createApp };
export default createApp();
