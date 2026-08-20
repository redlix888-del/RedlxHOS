"use client";

import { GrainGradient } from "@paper-design/shaders-react";
import { useState } from "react";
import type { ReactNode } from "react";

const formFields = [
  { label: "First Name", value: "Harshit", type: "text" },
  { label: "Last Name", value: "Sharma", type: "text" },
];

const termsText = (
  <>
    By creating an account, you agree to our{" "}
    <a
      href="#"
      className="font-medium text-zinc-900 underline underline-offset-2"
    >
      Terms and Services
    </a>{" "}
    and{" "}
    <a
      href="#"
      className="font-medium text-zinc-900 underline underline-offset-2"
    >
      Privacy Policy
    </a>
  </>
);

export default function AuthSectionOne() {
  return (
    <section className="h-screen max-h-screen overflow-hidden bg-zinc-50 p-3 text-zinc-900 antialiased [font-synthesis:none]">
      <div className="grid h-[calc(100vh-1.5rem)] gap-4 lg:gap-6 lg:grid-cols-[1.18fr_0.82fr]">
        <div className="flex h-full items-center overflow-y-auto rounded-xl border border-zinc-200 bg-white px-6 py-6 sm:px-10 shadow-sm lg:px-12 lg:py-8 xl:px-16">
          <div className="mx-auto w-full max-w-[500px]">
            <div>
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
                <a href="/" className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Home</span>
                </a>
                <span className="text-zinc-300">/</span>
                <span className="text-zinc-800 font-medium">Register</span>
              </nav>
              <h1 className="whitespace-nowrap text-2xl sm:text-3xl lg:text-[34px] font-medium tracking-tight text-zinc-950 lg:leading-[1.15]">
                Create an account
              </h1>
              <p className="mt-2 text-sm sm:text-base text-zinc-500 font-normal">
                Brainstorm in chat, build in cowork
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <SocialButton icon={<GoogleIcon />} label="Sign up with Google" />
              <SocialButton icon={<AppleIcon />} label="Sign up with Apple" />
            </div>

            <div className="my-5 text-center text-xs font-medium uppercase tracking-wider text-zinc-400">
              or
            </div>

            <form className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {formFields.map((field) => (
                  <FieldBox
                    key={field.label}
                    label={field.label}
                    value={field.value}
                  />
                ))}
              </div>

              <FieldBox
                label="Email"
                value="harshitlog@gmail.com"
                type="email"
              />
              <FieldBox
                label="Password"
                value="*************"
                type="password"
              />

              <div className="space-y-2.5 pt-1 text-xs text-zinc-500">
                <CheckboxLine>
                  I don&apos;t want to receive promotional feature updates
                </CheckboxLine>
                <CheckboxLine>{termsText}</CheckboxLine>
              </div>

              <button
                type="button"
                className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-zinc-950 text-sm sm:text-base font-medium text-white transition-all hover:bg-zinc-800 shadow-sm cursor-pointer"
              >
                Submit
              </button>
            </form>
          </div>
        </div>

        <div className="relative flex h-full overflow-hidden rounded-xl bg-gradient-to-br from-[#E61E32] via-[#b81424] to-[#800b17] p-6 text-white shadow-sm sm:p-8 lg:p-10">
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

export function SocialButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 text-xs sm:text-sm font-semibold text-zinc-800 transition-all hover:bg-zinc-100 hover:border-zinc-300 shadow-2xs cursor-pointer"
    >
      <span className="shrink-0">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

export function FieldBox({
  label,
  value,
  type = "text",
  name,
  onChange,
  required,
  error,
  autoComplete,
  placeholder,
}: {
  label: string;
  value?: string;
  type?: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState(value || "");
  const [isEditing, setIsEditing] = useState(!!value);

  const displayVal = onChange ? (value ?? "") : inputValue;

  return (
    <div className="w-full">
      <label className={`flex h-12 items-center justify-between gap-3 rounded-xl border ${error ? "border-red-400 bg-red-50/40 text-red-950 ring-1 ring-red-300" : "border-zinc-200 bg-white hover:border-zinc-300 focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/5"} px-4 text-sm transition-all cursor-text shadow-2xs`}>
        <input
          type={type}
          name={name}
          value={displayVal}
          required={required}
          autoComplete={autoComplete}
          aria-label={label}
          onFocus={() => {
            if (!isEditing && !displayVal) {
              setInputValue("");
              setIsEditing(true);
            }
          }}
          onChange={(event) => {
            if (onChange) {
              onChange(event);
            } else {
              setInputValue(event.target.value);
            }
            setIsEditing(true);
          }}
          placeholder={isEditing ? (placeholder || label) : ""}
          className="min-w-0 flex-1 truncate bg-transparent text-zinc-900 outline-none placeholder:text-zinc-400 font-medium text-sm"
        />
        {!isEditing && !displayVal && (
          <span className="shrink-0 text-zinc-400 text-xs font-normal select-none pointer-events-none">{label}</span>
        )}
      </label>
      {error && <p className="text-red-600 text-[11px] mt-1 font-medium pl-1">{error}</p>}
    </div>
  );
}

export function CheckboxLine({ children }: { children: ReactNode }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer select-none">
      <span className="relative mt-0.5 size-4 shrink-0">
        <input
          type="checkbox"
          className="peer size-full appearance-none rounded border border-zinc-300 bg-white checked:border-zinc-900 checked:bg-zinc-900 transition-colors"
        />
        <svg
          viewBox="0 0 12 12"
          className="pointer-events-none absolute inset-0 hidden size-full p-0.5 text-white peer-checked:block"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 6.2 5 8.1 9 3.9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-xs text-zinc-600">{children}</span>
    </label>
  );
}

export function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
        fill="#EB4335"
      />
    </svg>
  );
}

export function AppleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="text-zinc-900"
    >
      <path d="M17.05 12.54c-.03-3.02 2.47-4.47 2.58-4.54-1.41-2.06-3.6-2.34-4.38-2.37-1.86-.19-3.64 1.1-4.58 1.1-.95 0-2.42-1.07-3.98-1.04-2.05.03-3.94 1.19-4.99 3.02-2.13 3.69-.54 9.16 1.53 12.15 1.01 1.46 2.22 3.1 3.81 3.04 1.53-.06 2.11-.99 3.96-.99s2.37.99 3.99.96c1.65-.03 2.69-1.49 3.69-2.96 1.16-1.69 1.64-3.33 1.66-3.41-.04-.02-3.2-1.23-3.24-4.87ZM14.03 3.66c.84-1.02 1.41-2.43 1.25-3.84-1.21.05-2.68.81-3.55 1.83-.78.9-1.46 2.34-1.28 3.72 1.35.1 2.73-.69 3.58-1.71Z" />
    </svg>
  );
}

export function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 4.7 10.7 3.6v7.7H3V4.7Zm8.8-1.25L21 2.1v9.2h-9.2V3.45ZM3 12.7h7.7v7.7L3 19.3v-6.6Zm8.8 0H21v9.2l-9.2-1.3v-7.9Z" />
    </svg>
  );
}

