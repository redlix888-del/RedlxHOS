import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { setTeamSessionCookie } from "@/lib/auth";

/**
 * GET /api/team/auth/callback/google
 * Handles the redirect back from Google for Team Console sign-in.
 *
 * Flow:
 *  1. Validate CSRF state
 *  2. Exchange `code` for tokens via Google's token endpoint
 *  3. Fetch user profile from Google's userinfo endpoint
 *  4. Look up TeamMember by googleId OR email:
 *     - If found → update googleId/avatar and sign them in
 *     - If not found → redirect to /team/join (they need to join a team first)
 *  5. Set team session cookie (hackos_team_session)
 *  6. Redirect to /team/dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const stateFromGoogle = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/team/auth/callback/google`;

  // ── Handle user-denied consent ───────────────────────────────────────────────
  if (errorParam) {
    return NextResponse.redirect(
      `${appUrl}/team/login?error=${encodeURIComponent("Google sign-in was cancelled.")}`
    );
  }

  // ── Validate required params ──────────────────────────────────────────────────
  if (!code || !stateFromGoogle) {
    return NextResponse.redirect(
      `${appUrl}/team/login?error=${encodeURIComponent("Invalid OAuth response from Google.")}`
    );
  }

  // ── CSRF: Validate state token ────────────────────────────────────────────────
  const cookieStore = await cookies();
  const storedState = cookieStore.get("team_google_oauth_state")?.value;
  cookieStore.delete("team_google_oauth_state"); // consume immediately

  if (!storedState || storedState !== stateFromGoogle) {
    return NextResponse.redirect(
      `${appUrl}/team/login?error=${encodeURIComponent("Security check failed. Please try again.")}`
    );
  }

  // ── Exchange code for tokens ──────────────────────────────────────────────────
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${appUrl}/team/login?error=${encodeURIComponent("OAuth is not configured on the server.")}`
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
      console.error("[Team Google OAuth] Token exchange failed:", errBody);
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
    console.error("[Team Google OAuth] Error:", err);
    return NextResponse.redirect(
      `${appUrl}/team/login?error=${encodeURIComponent("Failed to sign in with Google. Please try again.")}`
    );
  }

  // ── Look up TeamMember or Team (lead) by googleId or email ───────────────────
  try {
    // 1. Check if a TeamMember exists with this googleId or email
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        OR: [
          { googleId: googleProfile.id },
          { email: googleProfile.email },
        ],
      },
    });

    if (existingMember) {
      // Update OAuth fields and avatar on subsequent logins
      const updatedMember = await prisma.teamMember.update({
        where: { id: existingMember.id },
        data: {
          googleId: googleProfile.id,
          authProvider: "google",
          avatarUrl: googleProfile.picture ?? existingMember.avatarUrl,
          fullName: existingMember.fullName || googleProfile.name,
        },
      });
      await setTeamSessionCookie(updatedMember.id);
      return NextResponse.redirect(`${appUrl}/team/dashboard`);
    }

    // 2. Check if a Team Lead exists with this googleId or email (Team model)
    const existingTeamLead = await prisma.team.findFirst({
      where: {
        OR: [
          { googleId: googleProfile.id },
          { email: googleProfile.email },
        ],
      },
    });

    if (existingTeamLead) {
      const updatedTeam = await prisma.team.update({
        where: { id: existingTeamLead.id },
        data: {
          googleId: googleProfile.id,
          authProvider: "google",
          avatarUrl: googleProfile.picture ?? existingTeamLead.avatarUrl,
        },
      });
      await setTeamSessionCookie(updatedTeam.id);
      return NextResponse.redirect(`${appUrl}/team/dashboard`);
    }

    // 3. No existing account — this Google user is not registered in any team.
    // Redirect them to join a team using a join code, pre-filling their info via query params.
    const joinUrl = new URL(`${appUrl}/team/join`);
    joinUrl.searchParams.set("googleName", googleProfile.name);
    joinUrl.searchParams.set("googleEmail", googleProfile.email);
    joinUrl.searchParams.set("googleId", googleProfile.id);
    joinUrl.searchParams.set("googleAvatar", googleProfile.picture || "");
    joinUrl.searchParams.set(
      "info",
      "Sign in with Google successful! Enter your team invite code to join your team."
    );

    return NextResponse.redirect(joinUrl.toString());
  } catch (err) {
    console.error("[Team Google OAuth] DB error:", err);
    return NextResponse.redirect(
      `${appUrl}/team/login?error=${encodeURIComponent("Account lookup failed. Please try again.")}`
    );
  }
}
