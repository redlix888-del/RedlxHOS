"use client";

import { useState, useActionState, startTransition } from "react";
import Link from "next/link";
import { teamSignUpAction } from "../../actions/team-auth-actions";
import { GrainGradient } from "@paper-design/shaders-react";
import { FieldBox, SocialButton, GoogleIcon, AppleIcon } from "@/components/ui/auth-section-1";
import { Loader2, ArrowLeft } from "lucide-react";

interface HackathonInfo {
  id: string;
  title: string;
}

interface TeamSignUpFormProps {
  hackathon: HackathonInfo;
}

export default function TeamSignUpForm({ hackathon }: TeamSignUpFormProps) {
  const [formData, setFormData] = useState({
    teamName: "",
    teamLeadName: "",
    email: "",
    password: "",
    confirmPassword: "",
    hackathonId: hackathon.id,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, formAction, isPending] = useActionState(teamSignUpAction, null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.teamName.trim()) e.teamName = "Team name is required";
    if (!formData.teamLeadName.trim()) e.teamLeadName = "Team lead name is required";
    if (!formData.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Enter a valid email address";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 6) e.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    const data = new FormData();
    data.append("teamName", formData.teamName);
    data.append("teamLeadName", formData.teamLeadName);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("hackathonId", formData.hackathonId);

    startTransition(() => {
      formAction(data);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <section className="h-screen max-h-screen overflow-hidden bg-zinc-50 p-3 text-zinc-900 antialiased [font-synthesis:none]">
      <div className="grid h-[calc(100vh-1.5rem)] gap-4 lg:gap-6 lg:grid-cols-[1.18fr_0.82fr] overflow-hidden">
        
        {/* Left Form Card - Crisp Light */}
        <div className="flex h-full flex-col justify-between overflow-y-auto rounded-xl border border-zinc-200 bg-white px-6 py-6 sm:px-10 shadow-sm lg:px-12 lg:py-8 xl:px-16">
          <div className="mx-auto w-full max-w-[500px] my-auto">
            
            {/* Header & Breadcrumbs */}
            <div>
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500 mb-3">
                <Link href="/" className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors font-medium">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Home</span>
                </Link>
                <span className="text-zinc-300">/</span>
                <span className="text-zinc-800 font-medium truncate max-w-[200px]">Register Team ({hackathon.title})</span>
              </nav>
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-medium tracking-tight text-zinc-950 lg:leading-[1.15]">
                Register Team
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-normal">
                Set up your team credentials and enter the competition
              </p>
            </div>

            {/* Error banner */}
            {state?.error && (
              <div className="bg-red-50 text-red-700 text-xs p-3.5 border border-red-200 my-3 font-medium rounded-xl">
                {state.error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 my-4" noValidate>
              <input type="hidden" name="hackathonId" value={formData.hackathonId} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldBox
                  label="Team Name"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleChange}
                  error={errors.teamName}
                  placeholder="e.g. Neural Ninjas"
                />
                <FieldBox
                  label="Team Lead Name"
                  name="teamLeadName"
                  value={formData.teamLeadName}
                  onChange={handleChange}
                  error={errors.teamLeadName}
                  placeholder="e.g. John Doe"
                  autoComplete="name"
                />
              </div>

              <FieldBox
                label="Team Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                autoComplete="email"
                placeholder="e.g. lead@hackos.io"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldBox
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  autoComplete="new-password"
                  placeholder="Min. 6 chars"
                />
                <FieldBox
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                  placeholder="Re-enter"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 text-sm sm:text-base font-medium text-white transition-all hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering Team...</span>
                  </>
                ) : (
                  "Register Team & Launch Squad"
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-zinc-150 flex items-center justify-between text-xs text-zinc-500">
              <span>Already registered?</span>
              <Link
                href={`/team/login?hackathonId=${hackathon.id}`}
                className="text-[#E61E32] font-semibold hover:underline"
              >
                Sign In to Team
              </Link>
            </div>

          </div>
        </div>

        {/* Right Vibrant Gradient Shader Card */}
        <div className="relative hidden lg:flex h-full overflow-hidden rounded-xl bg-gradient-to-br from-[#E61E32] via-[#b81424] to-[#800b17] p-6 text-white shadow-sm sm:p-8 lg:p-10">
          <GrainGradient
            speed={1}
            scale={1}
            rotation={0}
            offsetX={0}
            offsetY={0}
            softness={0.5}
            intensity={0.5}
            noise={0.25}
            shape="corners"
            frame={2854.5}
            colors={["#FFFFFF", "#FFA0A8", "#E61E32", "#FFFFFF"]}
            colorBack="#E61E32"
            className="absolute inset-0 opacity-90"
          />

          <div className="relative z-10 flex h-full w-full max-w-[440px] flex-col justify-between">
            <h2 className="pt-0 text-3xl font-medium tracking-tight text-white drop-shadow-sm sm:text-4xl lg:pt-8 lg:text-[42px] lg:leading-[1.08]">
              Form squad,
              <br />
              Conquer the hack
            </h2>

            <div className="pt-8">
              <p className="text-xs text-white/70 font-medium">
                © {new Date().getFullYear()} Redlix Studio. All rights reserved.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

