import { redirect } from "next/navigation";
import crypto from "crypto";
import { cookies } from "next/headers";

/**
 * GET /api/team/auth/google
 * Initiates the Google OAuth flow for Team Console.
 * Stores a CSRF state cookie then redirects to Google's consent screen.
 * The callback will look up / create a TeamMember by Google email.
 */
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!clientId) {
    return new Response("Google OAuth is not configured (missing GOOGLE_CLIENT_ID)", {
      status: 500,
    });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "login";

  // Generate a CSRF-safe state token
  const csrfToken = crypto.randomBytes(32).toString("hex");

  const statePayload = JSON.stringify({
    token: csrfToken,
    mode,
  });

  const cookieStore = await cookies();
  cookieStore.set("team_google_oauth_state", statePayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  const redirectUri = `${appUrl}/api/team/auth/callback/google`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: csrfToken,
    access_type: "offline",
    prompt: "select_account",
  });

  redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
