import { getSessionMentor } from "../../../lib/auth";
import { redirect } from "next/navigation";
import MentorLoginForm from "./LoginForm";

export default async function MentorLoginPage() {
  const mentor = await getSessionMentor();

  // If already logged in, redirect directly to the panel
  if (mentor) {
    redirect("/mentor/panel");
  }

  return <MentorLoginForm />;
}
