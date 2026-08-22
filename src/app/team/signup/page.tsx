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

  let hackathon = null;

  if (hackathonId) {
    hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: { id: true, title: true },
    });
  }

  // Fallback to latest active hackathon if no ID was specified in URL
  if (!hackathon) {
    hackathon = await prisma.hackathon.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    });
  }

  if (!hackathon) {
    redirect("/active-hacks");
  }

  return <TeamSignUpForm hackathon={hackathon} />;
}

