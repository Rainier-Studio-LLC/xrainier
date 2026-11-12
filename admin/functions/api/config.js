// GET /api/config → what the sign-in page needs (public values only)
import { json, setupProblems } from "../../lib/core.js";
export const onRequestGet = ({ env }) => json({ google: env.GOOGLE_CLIENT_ID || null, missing: setupProblems(env) });
