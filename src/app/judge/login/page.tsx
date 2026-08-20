import { getSessionJudge } from "../../../lib/auth";
import { redirect } from "next/navigation";
import JudgeLoginForm from "./LoginForm";

export default async function JudgeLoginPage() {
  const judge = await getSessionJudge();

  // If already logged in, redirect directly to the panel
  if (judge) {
    redirect("/judge/panel");
  }

  return <JudgeLoginForm />;
}

