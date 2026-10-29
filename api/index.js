// Vercel serverless function entry point for React Router SSR.
// The Vercel preset (@vercel/react-router) doesn't support RR v8 yet
// (https://github.com/vercel/vercel/issues/16730), so we wire up
// @react-router/node's createRequestHandler manually.
import { createRequestHandler } from "@react-router/node";

// build/server/index.js is produced by `react-router build` (SSR build).
// The path is relative to the project root, which is where Vercel runs this.
const build = await import("../build/server/index.js");

export default createRequestHandler({ build });
