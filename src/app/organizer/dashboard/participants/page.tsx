import { getSessionUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";
import { redirect } from "next/navigation";
import ParticipantsManager from "./ParticipantsManager";

export default async function ParticipantsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch direct registrations for hackathons belonging to this organizer
  const registrations = await prisma.registration.findMany({
    where: {
      hackathon: {
        organizerId: user.id,
      },
    },
    include: {
      hackathon: true,
      participant: true,
    },
    orderBy: {
      registeredAt: "desc",
    },
  });

  // Fetch teams and team members for hackathons belonging to this organizer
  const teams = await prisma.team.findMany({
    where: {
      hackathon: {
        organizerId: user.id,
      },
    },
    include: {
      hackathon: true,
      members: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Map team leads and team members into the registration data structure
  const teamRegistrations = teams.flatMap((team) => {
    const leadReg = {
      id: `team-lead-${team.id}`,
      registeredAt: team.createdAt,
      ticketTierName: `Team Lead (${team.teamName})`,
      paymentMode: "TEAM",
      ticketPriceINR: 0,
      transactionId: `Code: ${team.joinCode}`,
      paymentStatus: "Approved",
      participant: {
        fullName: team.teamLeadName,
        email: team.email,
        phone: null,
      },
      hackathon: {
        title: team.hackathon.title,
      },
    };

    const memberRegs = team.members.map((member) => ({
      id: `team-member-${member.id}`,
      registeredAt: member.createdAt,
      ticketTierName: `Member (${team.teamName})`,
      paymentMode: "TEAM",
      ticketPriceINR: 0,
      transactionId: `Team: ${team.teamName}`,
      paymentStatus: "Approved",
      participant: {
        fullName: member.fullName,
        email: member.email,
        phone: null,
      },
      hackathon: {
        title: team.hackathon.title,
      },
    }));

    return [leadReg, ...memberRegs];
  });

  const allRegistrations = [...registrations, ...teamRegistrations].sort(
    (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
  );

  return (
    <main className="p-6 md:p-8 w-full space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Registrations & Participants</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Review, search, and manage all registrations across your hosted hackathons.
        </p>
      </div>

      {/* Participants Manager filter & table */}
      <ParticipantsManager initialRegistrations={allRegistrations} />

    </main>
  );
}
