import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

/**
 * GET /api/auth/callback/google
 * Handles the redirect back from Google after the user grants consent.
 *
 * Flow:
 *  1. Validate CSRF state
 *  2. Exchange `code` for tokens via Google's token endpoint
 *  3. Fetch the user's profile from Google's userinfo endpoint
 *  4. Upsert Organizer in DB (create on first login, update avatar/name on subsequent logins)
 *  5. Set session cookie (reusing existing auth infrastructure)
 *  6. Redirect to /organizer dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const stateFromGoogle = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  // ── Handle user-denied consent ──────────────────────────────────────────────
  if (errorParam) {
    return NextResponse.redirect(
      `${appUrl}/sign-in?error=${encodeURIComponent("Google sign-in was cancelled.")}`
    );
  }

  // ── Validate required params ─────────────────────────────────────────────────
  if (!code || !stateFromGoogle) {
    return NextResponse.redirect(
      `${appUrl}/sign-in?error=${encodeURIComponent("Invalid OAuth response from Google.")}`
    );
  }

  // ── CSRF: Validate state token & Role Payload ─────────────────────────────────
  const cookieStore = await cookies();
  const storedStateRaw = cookieStore.get("google_oauth_state")?.value;
  cookieStore.delete("google_oauth_state"); // consume immediately

  let storedToken = storedStateRaw;
  let isVerifiedOrganizer = true;
  let role = "organizer";

  if (storedStateRaw && storedStateRaw.startsWith("{")) {
    try {
      const parsed = JSON.parse(storedStateRaw);
      storedToken = parsed.token;
      role = parsed.role || "organizer";
      isVerifiedOrganizer = parsed.verified ?? true;
    } catch (e) {
      // fallback
    }
  }

  if (!storedToken || storedToken !== stateFromGoogle) {
    return NextResponse.redirect(
      `${appUrl}/sign-in?error=${encodeURIComponent("Security check failed. Please try again.")}`
    );
  }

  if (role === "organizer" && !isVerifiedOrganizer) {
    return NextResponse.redirect(
      `${appUrl}/sign-in?error=${encodeURIComponent("Organizer Secret Access Key is required for Organizer login.")}`
    );
  }

  // ── Exchange code for tokens ─────────────────────────────────────────────────
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${appUrl}/sign-in?error=${encodeURIComponent("OAuth is not configured on the server.")}`
    );
  }

  let googleProfile: { id: string; email: string; name: string; picture: string };

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error("[Google OAuth] Token exchange failed:", errBody);
      throw new Error("Token exchange failed");
    }

    const tokens = await tokenResponse.json();

    // ── Fetch Google profile ───────────────────────────────────────────────────
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) {
      throw new Error("Failed to fetch Google profile");
    }

    googleProfile = await profileResponse.json();
  } catch (err) {
    console.error("[Google OAuth] Error:", err);
    return NextResponse.redirect(
      `${appUrl}/sign-in?error=${encodeURIComponent("Failed to sign in with Google. Please try again.")}`
    );
  }

  // ── Upsert Organizer in DB ───────────────────────────────────────────────────
  try {
    // Check if an organizer already exists with this Google ID OR this email
    let organizer = await prisma.organizer.findFirst({
      where: {
        OR: [{ googleId: googleProfile.id }, { email: googleProfile.email }],
      },
    });

    if (organizer) {
      // Update OAuth fields in case they signed up with credentials before
      organizer = await prisma.organizer.update({
        where: { id: organizer.id },
        data: {
          googleId: googleProfile.id,
          authProvider: "google",
          avatarUrl: googleProfile.picture ?? organizer.avatarUrl,
        },
      });
    } else {
      // First-time Google sign-in — create a new organizer account
      organizer = await prisma.organizer.create({
        data: {
          fullName: googleProfile.name,
          email: googleProfile.email,
          googleId: googleProfile.id,
          authProvider: "google",
          avatarUrl: googleProfile.picture,
          // Required fields — set sensible defaults; organizer can update these later
          designation: "Organizer",
          organizationName: "My Organization",
          // passwordHash is null (OAuth account)
        },
      });
    }

    // ── Set session cookie (same system used for credentials auth) ──────────────
    await setSessionCookie(organizer.id);
    return NextResponse.redirect(`${appUrl}/organizer`);
  } catch (err) {
    console.error("[Google OAuth] DB upsert error:", err);
    return NextResponse.redirect(
      `${appUrl}/sign-in?error=${encodeURIComponent("Account setup failed. Please try again.")}`
    );
  }
}
