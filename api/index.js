// Vercel serverless function entry point for React Router v8 SSR.
// react-router's createRequestHandler returns a standard fetch handler:
//   (request: Request) => Promise<Response>
// That is exactly the signature Vercel expects for an ESM function export.
import { createRequestHandler } from "react-router";

const build = await import("../build/server/index.js");

export default createRequestHandler(build);
