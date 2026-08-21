"use client";

import { useState, useActionState, startTransition } from "react";
import Link from "next/link";
import { signInAction } from "../actions/auth-actions";
import { GrainGradient } from "@paper-design/shaders-react";
import { FieldBox, SocialButton, GoogleIcon, AppleIcon } from "@/components/ui/auth-section-1";
import { Loader2, ArrowLeft } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizerKey, setOrganizerKey] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  const [state, formAction, isPending] = useActionState(signInAction, null);

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const validatePassword = (value: string) => {
    return value.length >= 6;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let valid = true;

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid work email address.");
      valid = false;
    } else {
      setEmailError("");
    }

    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 6 characters.");
      valid = false;
    } else {
      setPasswordError("");
    }

    if (valid) {
      const formData = new FormData(e.currentTarget);
      startTransition(() => {
        formAction(formData);
      });
    }
  };

  return (
    <section className="h-screen max-h-screen overflow-hidden bg-zinc-50 p-3 text-zinc-900 antialiased [font-synthesis:none]">
      <div className="grid h-[calc(100vh-1.5rem)] gap-4 lg:gap-6 lg:grid-cols-[1.18fr_0.82fr] overflow-hidden">
        
        {/* Left Form Card - Crisp Light */}
        <div className="flex h-full flex-col justify-between overflow-y-auto rounded-xl border border-zinc-200 bg-white px-6 py-6 sm:px-10 shadow-sm lg:px-12 lg:py-8 xl:px-16">
          <div className="mx-auto w-full max-w-[500px] my-auto">
            
            {/* Header & Breadcrumb */}
            <div>
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
                <Link href="/" className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors font-medium">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Home</span>
                </Link>
                <span className="text-zinc-300">/</span>
                <span className="text-zinc-800 font-medium">Sign In</span>
              </nav>
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-medium tracking-tight text-zinc-950 lg:leading-[1.15]">
                Sign in to HackOS
              </h1>
              <p className="mt-2 text-sm sm:text-base text-zinc-500 font-normal">
                Manage your active hackathons, judges, and submissions
              </p>
            </div>

            {/* Organizer Secret Key Input for OAuth */}
            <div className="mt-5">
              <FieldBox
                label="Organizer Secret Access Key (Required for Google Auth)"
                name="organizerKey"
                type="password"
                value={organizerKey}
                onChange={(e) => setOrganizerKey(e.target.value)}
                placeholder="Enter secret key (e.g. SNIST2026)"
              />
            </div>

            {/* Social Buttons */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SocialButton
                icon={<GoogleIcon />}
                label="Continue with Google"
                href={
                  organizerKey
                    ? `/api/auth/google?role=organizer&key=${encodeURIComponent(organizerKey)}`
                    : `/api/auth/google?role=organizer`
                }
              />
              <SocialButton icon={<AppleIcon />} label="Continue with Apple" />
            </div>

            <div className="my-5 text-center text-xs font-medium uppercase tracking-wider text-zinc-400">
              or sign in with email
            </div>

            {/* Error banner */}
            {state?.error && (
              <div className="bg-red-50 text-red-700 text-xs p-3.5 border border-red-200 mb-4 font-medium rounded-xl">
                {state.error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
              <FieldBox
                label="Work Email Address"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                error={emailError}
                autoComplete="email"
                placeholder="e.g. organizer@hackos.io"
              />

              <FieldBox
                label="Account Password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                error={passwordError}
                autoComplete="current-password"
                placeholder="Enter password"
              />

              <div className="flex items-center justify-between text-xs pt-1 text-zinc-500">
                <Link href="/sign-up" className="hover:text-zinc-900 underline underline-offset-2">
                  Don&apos;t have an account? Sign up
                </Link>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 text-sm sm:text-base font-medium text-white transition-all hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign In to HackOS"
                )}
              </button>
            </form>

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
              Think fast,
              <br />
              Build faster
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


