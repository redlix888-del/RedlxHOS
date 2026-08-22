import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { setSessionCookie, setTeamSessionCookie } from "@/lib/auth";

/**
 * GET /api/auth/callback/google
 * Unified Google OAuth Callback for both Organizer and Team roles.
 * Reuses the single authorized Google OAuth redirect URI registered in Google Cloud Console.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const stateFromGoogle = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  // ── CSRF: Validate state token & Role Payload ─────────────────────────────────
  const cookieStore = await cookies();
  const teamStateRaw = cookieStore.get("team_google_oauth_state")?.value;
  const organizerStateRaw = cookieStore.get("google_oauth_state")?.value;

  // Clear cookies immediately
  cookieStore.delete("team_google_oauth_state");
  cookieStore.delete("google_oauth_state");

  let storedToken: string | null = null;
  let role = "organizer";
  let mode = "login";
  let isVerifiedOrganizer = true;

  if (teamStateRaw) {
    role = "team";
    if (teamStateRaw.startsWith("{")) {
      try {
        const parsed = JSON.parse(teamStateRaw);
        storedToken = parsed.token;
        mode = parsed.mode || "login";
      } catch (e) {
        storedToken = teamStateRaw;
      }
    } else {
      storedToken = teamStateRaw;
    }
  } else if (organizerStateRaw) {
    if (organizerStateRaw.startsWith("{")) {
      try {
        const parsed = JSON.parse(organizerStateRaw);
        storedToken = parsed.token;
        role = parsed.role || "organizer";
        isVerifiedOrganizer = parsed.verified ?? true;
        mode = parsed.mode || "login";
      } catch (e) {
        storedToken = organizerStateRaw;
      }
    } else {
      storedToken = organizerStateRaw;
    }
  }

  const fallbackRedirect = role === "team" ? `${appUrl}/team/login` : `${appUrl}/sign-in`;

  // ── Handle user-denied consent ──────────────────────────────────────────────
  if (errorParam) {
    return NextResponse.redirect(
      `${fallbackRedirect}?error=${encodeURIComponent("Google sign-in was cancelled.")}`
    );
  }

  // ── Validate required params ─────────────────────────────────────────────────
  if (!code || !stateFromGoogle) {
    return NextResponse.redirect(
      `${fallbackRedirect}?error=${encodeURIComponent("Invalid OAuth response from Google.")}`
    );
  }

  if (!storedToken || storedToken !== stateFromGoogle) {
    return NextResponse.redirect(
      `${fallbackRedirect}?error=${encodeURIComponent("Security check failed. Please try again.")}`
    );
  }

  if (role === "organizer" && !isVerifiedOrganizer) {
    return NextResponse.redirect(
      `${appUrl}/sign-in?error=${encodeURIComponent("Organizer Secret Access Key is required for Organizer login.")}`
    );
  }

  // ── Exchange code for tokens ─────────────────────────────────────────────────
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${fallbackRedirect}?error=${encodeURIComponent("OAuth is not configured on the server.")}`
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
      `${fallbackRedirect}?error=${encodeURIComponent("Failed to sign in with Google. Please try again.")}`
    );
  }

  // ── Handle TEAM Role ────────────────────────────────────────────────────────
  if (role === "team") {
    try {
      // 1. Check if a TeamMember exists
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          OR: [{ googleId: googleProfile.id }, { email: googleProfile.email }],
        },
      });

      if (existingMember) {
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

      // 2. Check if a Team Lead exists (Team model)
      const existingTeamLead = await prisma.team.findFirst({
        where: {
          OR: [{ googleId: googleProfile.id }, { email: googleProfile.email }],
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

      // 3. Unregistered account
      if (mode === "join") {
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
      }

      return NextResponse.redirect(
        `${appUrl}/team/login?error=${encodeURIComponent("No team account found with this email. Please register your team first.")}`
      );
    } catch (err: any) {
      console.error("[Team Google OAuth] Error:", err);
      const detail = err?.message ? `: ${err.message}` : "";
      return NextResponse.redirect(
        `${appUrl}/team/login?error=${encodeURIComponent(`Google authentication failed${detail}`)}`
      );
    }
  }

  // ── Handle ORGANIZER Role ───────────────────────────────────────────────────
  try {
    let organizer = await prisma.organizer.findFirst({
      where: {
        OR: [{ googleId: googleProfile.id }, { email: googleProfile.email }],
      },
    });

    if (organizer) {
      organizer = await prisma.organizer.update({
        where: { id: organizer.id },
        data: {
          googleId: googleProfile.id,
          authProvider: "google",
          avatarUrl: googleProfile.picture ?? organizer.avatarUrl,
        },
      });
    } else {
      organizer = await prisma.organizer.create({
        data: {
          fullName: googleProfile.name,
          email: googleProfile.email,
          googleId: googleProfile.id,
          authProvider: "google",
          avatarUrl: googleProfile.picture,
          designation: "Organizer",
          organizationName: "My Organization",
        },
      });
    }

    await setSessionCookie(organizer.id);
    return NextResponse.redirect(`${appUrl}/organizer/dashboard`);
  } catch (err: any) {
    console.error("[Google OAuth] DB upsert error:", err);
    const detail = err?.message ? `: ${err.message}` : "";
    return NextResponse.redirect(
      `${appUrl}/sign-in?error=${encodeURIComponent(`Account setup failed${detail}`)}`
    );
  }
}
