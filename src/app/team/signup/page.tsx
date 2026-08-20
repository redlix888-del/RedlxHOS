import { prisma } from "../../../lib/db";
import TeamSignUpForm from "./TeamSignUpForm";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    hackathonId?: string;
  }>;
}

export default async function TeamSignUpPage({ searchParams }: PageProps) {
  const { hackathonId } = await searchParams;

  if (!hackathonId) {
    redirect("/active-hacks");
  }

  // Fetch the specific hackathon details
  const hackathon = await prisma.hackathon.findUnique({
    where: {
      id: hackathonId,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!hackathon) {
    redirect("/active-hacks");
  }

  return <TeamSignUpForm hackathon={hackathon} />;
}

