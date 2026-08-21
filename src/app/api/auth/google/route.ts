import { redirect } from "next/navigation";
import crypto from "crypto";
import { cookies } from "next/headers";

/**
 * GET /api/auth/google
 * Initiates the Google OAuth flow for Organizer accounts.
 * Generates a CSRF-safe state token, stores it in a short-lived cookie,
 * then redirects the browser to Google's consent screen.
 */
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!clientId) {
    return new Response("Google OAuth is not configured (missing GOOGLE_CLIENT_ID)", {
      status: 500,
    });
  }

  // Generate a random state token for CSRF protection
  const state = crypto.randomBytes(32).toString("hex");

  // Persist state in a short-lived, httpOnly cookie (10 minutes)
  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  const redirectUri = `${appUrl}/api/auth/callback/google`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
