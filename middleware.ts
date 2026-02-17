import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const hasClerkEnv = Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const passThroughMiddleware = (_req: NextRequest) => NextResponse.next();

export default hasClerkEnv ? clerkMiddleware() : passThroughMiddleware;

export const config = {
  matcher: [
    // Skip Next.js internals and static files unless query params are present
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)"
  ]
};
