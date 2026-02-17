import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";

const getCachedRegisteredUserCount = unstable_cache(
  async (): Promise<number> => {
    const client = await clerkClient();
    return client.users.getCount();
  },
  ["clerk-registered-user-count"],
  { revalidate: 300 }
);

export const getRegisteredUserCount = async (): Promise<number | null> => {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return null;
  }

  try {
    return await getCachedRegisteredUserCount();
  } catch {
    return null;
  }
};
