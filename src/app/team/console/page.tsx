import { redirect } from "next/navigation";
import { getSessionTeam } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TeamConsoleAliasPage() {
  const team = await getSessionTeam();
  if (team) {
    redirect("/team/dashboard");
  }
  redirect("/team/login");
}
