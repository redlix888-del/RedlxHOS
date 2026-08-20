import JoinTeamForm from "./JoinTeamForm";
import { Suspense } from "react";

interface PageProps {
  searchParams: Promise<{
    code?: string;
  }>;
}

async function JoinPageWrapper({ searchParams }: PageProps) {
  const { code } = await searchParams;
  return <JoinTeamForm initialCode={code || null} />;
}

export default function JoinTeamPage(props: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-500 font-medium">Loading...</div>}>
      <JoinPageWrapper {...props} />
    </Suspense>
  );
}

