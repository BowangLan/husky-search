import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";

export async function getConvexClient() {
  const session = await auth();
  return await getConvexClientFromSession(session);
}

export async function getConvexClientFromSession(session: Awaited<ReturnType<typeof auth>>) {
  if (!session) {
    throw new Error("Not authenticated");
  }

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your .env file");
  }

  const token = await session.getToken({ template: "convex" });

  if (!token) {
    throw new Error("Missing token");
  }

  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  client.setAuth(token!);

  return client;
}