import { getSessionTeam } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";
import { redirect } from "next/navigation";
import TeamProblemStatementsView from "./TeamProblemStatementsView";

export default async function TeamProblemStatementsPage() {
  const team = await getSessionTeam();
  if (!team) redirect("/team/login");

  // Fetch problem statements for the hackathon
  const statements = await prisma.problemStatement.findMany({
    where: { hackathonId: team.hackathonId },
    orderBy: { createdAt: "asc" },
  });

  // Fetch full team data to get currently locked in problemStatementId
  const dbTeam = await prisma.team.findUnique({
    where: { id: team.id },
    select: { problemStatementId: true, teamName: true },
  });

  return (
    <main className="p-6 md:p-8 max-w-5xl w-full mx-auto animate-in fade-in duration-200">
      <TeamProblemStatementsView
        statements={statements}
        currentSelectedId={dbTeam?.problemStatementId || null}
        isTeamLead={!!team.isLead}
        teamName={team.teamName}
      />
    </main>
  );
}
