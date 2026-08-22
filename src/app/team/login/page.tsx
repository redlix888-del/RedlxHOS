import { getSessionTeam } from "../../../lib/auth";
import { redirect } from "next/navigation";
import TeamLoginClient from "./TeamLoginClient";

export default async function TeamLoginPage() {
  // If already logged in as a team, go straight to dashboard
  const session = await getSessionTeam();
  if (session) {
    redirect("/team/dashboard");
  }

  return <TeamLoginClient />;
}
