"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginJudgeAction } from "../../actions/judging-actions";
import { GrainGradient } from "@paper-design/shaders-react";
import { FieldBox } from "@/components/ui/auth-section-1";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";

export default function JudgeLoginForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 6) {
      setCode(val);
      if (error) setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter a valid 6-digit access code.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await loginJudgeAction(code);
      if (res.success) {
        router.refresh();
        router.push("/judge/panel");
      } else {
        setError(res.error || "Authentication failed. Invalid or expired code.");
      }
    });
  };

  return (
    <section className="h-screen max-h-screen overflow-hidden bg-white p-3 text-black antialiased [font-synthesis:none] dark:bg-[#050505] dark:text-white">
      <div className="grid h-[calc(100vh-1.5rem)] gap-4 lg:gap-6 lg:grid-cols-[1.18fr_0.82fr] overflow-hidden">
        
        {/* Left Form Card */}
        <div className="flex h-full flex-col justify-between overflow-y-auto rounded-xl border border-black/15 bg-white px-6 py-6 sm:px-10 dark:border-white/10 dark:bg-[#0a0a0a] lg:px-12 lg:py-8 xl:px-16">
          <div className="mx-auto w-full max-w-[500px] my-auto">
            
            {/* Header & Breadcrumbs */}
            <div>
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-black/50 dark:text-white/50 mb-4">
                <Link href="/" className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors font-medium">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Home</span>
                </Link>
                <span className="text-black/20 dark:text-white/20">/</span>
                <span className="text-black dark:text-white font-medium">Jury Access</span>
              </nav>
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-medium tracking-tight lg:leading-[1.15]">
                Enter Jury Access Code
              </h1>
              <p className="mt-2 text-sm sm:text-base text-black/60 dark:text-white/55 font-normal">
                Enter the 6-digit dynamic access code provided by your hackathon organizer
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs p-3 border border-red-200 dark:border-red-800/50 my-4 font-medium rounded-md">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 my-6" noValidate>
              <div>
                <FieldBox
                  label="6-Digit Access Code"
                  type="text"
                  value={code}
                  onChange={handleInputChange}
                  placeholder="e.g. 482910"
                  error={error ? undefined : undefined}
                />
              </div>

              <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-3 rounded-lg text-xs text-zinc-500 leading-relaxed">
                <span className="font-semibold text-[#E61E32]">Note:</span> Codes are valid for exactly 5 minutes from generation. Please request a new code from the organizer if yours has expired.
              </div>

              <button
                type="submit"
                disabled={isPending || code.length !== 6}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-black/40 bg-black text-sm sm:text-base font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/40 dark:bg-white dark:text-black dark:hover:bg-white/85 cursor-pointer shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Authenticating Jury Session...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Jury Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs text-black/50 dark:text-white/40">
              <span>Return to login options</span>
              <Link href="/team/login" className="text-black dark:text-white font-semibold hover:underline">
                Team Login
              </Link>
            </div>

          </div>
        </div>

        {/* Right Gradient Shader Card */}
        <div className="relative hidden lg:flex h-full overflow-hidden rounded-xl bg-black p-6 text-white sm:p-8 lg:p-10">
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
            colors={["#FFFFFF", "#E61E32", "#E61E32", "#FFFFFF"]}
            colorBack="#00000000"
            className="absolute inset-0 bg-black"
          />

          <div className="relative z-10 flex h-full w-full max-w-[440px] flex-col justify-between">
            <h2 className="pt-0 text-3xl font-medium tracking-tight text-white sm:text-4xl lg:pt-8 lg:text-[42px] lg:leading-[1.08]">
              Evaluate fast,
              <br />
              Score precisely
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

