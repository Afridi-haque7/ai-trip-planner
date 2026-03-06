export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export async function GET(request) {
  const auth = await getAuth();
  return toNextJsHandler(auth).GET(request);
}

export async function POST(request) {
  const auth = await getAuth();
  return toNextJsHandler(auth).POST(request);
}