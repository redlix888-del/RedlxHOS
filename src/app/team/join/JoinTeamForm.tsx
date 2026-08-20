"use client";

import { useState, useActionState, startTransition, useEffect } from "react";
import Link from "next/link";
import { verifyJoinCodeAction, joinTeamAction } from "../../actions/team-auth-actions";
import { GrainGradient } from "@paper-design/shaders-react";
import { FieldBox } from "@/components/ui/auth-section-1";
import { Users, Loader2, ArrowRight, CheckCircle2, ArrowLeft } from "lucide-react";

interface JoinTeamFormProps {
  initialCode: string | null;
}

export default function JoinTeamForm({ initialCode }: JoinTeamFormProps) {
  const [step, setStep] = useState(initialCode ? 2 : 1);
  const [joinCode, setJoinCode] = useState(initialCode || "");
  const [verifiedTeam, setVerifiedTeam] = useState<{ id: string; name: string } | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [codeError, setCodeError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, formAction, isPending] = useActionState(joinTeamAction, null);

  useEffect(() => {
    if (initialCode) {
      verifyJoinCodeAction(initialCode).then((res) => {
        if (res.success && res.teamId && res.teamName) {
          setVerifiedTeam({ id: res.teamId, name: res.teamName });
          setStep(2);
        } else {
          setCodeError(res.error || "Failed to verify invite code.");
          setStep(1);
        }
      });
    }
  }, [initialCode]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setCodeError("Invite code is required");
      return;
    }
    setCodeError("");

    const res = await verifyJoinCodeAction(joinCode.trim().toUpperCase());
    if (res.success && res.teamId && res.teamName) {
      setVerifiedTeam({ id: res.teamId, name: res.teamName });
      setStep(2);
    } else {
      setCodeError(res.error || "Failed to verify invite code.");
    }
  };

  const validateProfile = () => {
    const e: Record<string, string> = {};
    if (!formData.fullName.trim()) e.fullName = "Full name is required";
    if (!formData.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Enter a valid email address";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 6) e.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedTeam) return;

    const validationErrors = validateProfile();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    const data = new FormData();
    data.append("fullName", formData.fullName);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("teamId", verifiedTeam.id);

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
                <span className="text-zinc-800 font-medium">Join Team</span>
              </nav>
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-medium tracking-tight text-zinc-950 lg:leading-[1.15]">
                {step === 1 ? "Join Team Squad" : "Complete Registration"}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-normal">
                {step === 1 
                  ? "Enter the unique 6-character team invite code from your Team Lead" 
                  : `Creating developer profile for team: ${verifiedTeam?.name}`}
              </p>
            </div>

            {/* Error banners */}
            {codeError && (
              <div className="bg-red-50 text-red-700 text-xs p-3.5 border border-red-200 my-3 font-medium rounded-xl">
                {codeError}
              </div>
            )}
            {state?.error && (
              <div className="bg-red-50 text-red-700 text-xs p-3.5 border border-red-200 my-3 font-medium rounded-xl">
                {state.error}
              </div>
            )}

            {/* STEP 1: VERIFY CODE */}
            {step === 1 && (
              <form onSubmit={handleVerifyCode} className="space-y-4 my-4" noValidate>
                <FieldBox
                  label="Team Invite Code"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A8D2F9"
                  error={codeError ? undefined : undefined}
                />

                <button
                  type="submit"
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 text-sm sm:text-base font-medium text-white transition-all hover:bg-zinc-800 cursor-pointer shadow-sm"
                >
                  <span>Verify Team Code</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: PROFILE DETAILS */}
            {step === 2 && verifiedTeam && (
              <form onSubmit={handleSubmitProfile} className="space-y-3 my-4" noValidate>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Joining Team: <strong className="font-bold">{verifiedTeam.name}</strong></span>
                </div>

                <FieldBox
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  error={errors.fullName}
                  placeholder="e.g. Jane Doe"
                  autoComplete="name"
                />

                <FieldBox
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="e.g. jane.doe@gmail.com"
                  autoComplete="email"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldBox
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    placeholder="Min. 6 chars"
                    autoComplete="new-password"
                  />
                  <FieldBox
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    placeholder="Confirm"
                    autoComplete="new-password"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-12 px-4 rounded-xl border border-zinc-300 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    Change Code
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 h-12 rounded-xl bg-zinc-950 text-sm sm:text-base font-medium text-white transition-all hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Joining Team...</span>
                      </>
                    ) : (
                      "Join Squad & Launch Dashboard"
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 border-t border-zinc-150 flex items-center justify-between text-xs text-zinc-500">
              <span>Are you a Team Lead?</span>
              <Link href="/team/login" className="text-[#E61E32] font-semibold hover:underline">
                Team Login
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
              Sync in real-time,
              <br />
              Code as one
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

