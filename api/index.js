// Vercel Function: every /api/* request is rewritten here (see vercel.json).
// The server is compiled to server/dist by the build command before functions are bundled.
import { createHandler } from '../server/dist/vercel.js';

export default createHandler();
