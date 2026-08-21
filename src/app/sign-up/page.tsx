"use client";

import { useState, useActionState, startTransition } from "react";
import Link from "next/link";
import { signUpAction } from "../actions/auth-actions";
import { GrainGradient } from "@paper-design/shaders-react";
import { FieldBox, SocialButton, GoogleIcon, AppleIcon } from "@/components/ui/auth-section-1";
import { Loader2, ArrowLeft } from "lucide-react";

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    organizationName: "",
    phone: "",
    designation: "",
    website: "",
    password: "",
    confirmPassword: "",
    organizerKey: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [state, formAction, isPending] = useActionState(signUpAction, null);

  const validateStep = (currentStep: number) => {
    const e: Record<string, string> = {};
    if (currentStep === 1) {
      if (!formData.fullName.trim()) e.fullName = "Full name is required";
      if (!formData.email) e.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Enter a valid email";
      if (!formData.designation.trim()) e.designation = "Designation is required";
      if (!formData.organizerKey.trim()) e.organizerKey = "Organizer Secret Key is required";
    } else if (currentStep === 2) {
      if (!formData.organizationName.trim()) e.organizationName = "Organisation name is required";
    } else if (currentStep === 3) {
      if (!formData.password) e.password = "Password is required";
      else if (formData.password.length < 8) e.password = "Must be at least 8 characters";
      if (!formData.confirmPassword) e.confirmPassword = "Please confirm your password";
      else if (formData.password !== formData.confirmPassword) e.confirmPassword = "Passwords do not match";
      if (!formData.agreeTerms) e.agreeTerms = "You must accept the terms";
    }
    return e;
  };

  const handleNext = () => {
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep((prev) => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stepErrors = validateStep(3);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});

    const data = new FormData();
    data.append("fullName", formData.fullName);
    data.append("email", formData.email);
    data.append("organizationName", formData.organizationName);
    data.append("phone", formData.phone);
    data.append("designation", formData.designation);
    data.append("website", formData.website);
    data.append("password", formData.password);
    data.append("organizerKey", formData.organizerKey);

    startTransition(() => {
      formAction(data);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
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
                <span className="text-zinc-800 font-medium">Organizer Sign Up</span>
              </nav>
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-medium tracking-tight text-zinc-950 lg:leading-[1.15]">
                {step === 1 && "Personal Information"}
                {step === 2 && "Organisation Details"}
                {step === 3 && "Security Settings"}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-normal">
                Step {step} of 3 — Set up your organizer profile
              </p>
            </div>

            {/* Social Buttons — only shown on step 1 */}
            {step === 1 && (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <SocialButton
                    icon={<GoogleIcon />}
                    label="Continue with Google"
                    href={
                      formData.organizerKey
                        ? `/api/auth/google?role=organizer&key=${encodeURIComponent(formData.organizerKey)}`
                        : `/api/auth/google?role=organizer`
                    }
                  />
                  <SocialButton icon={<AppleIcon />} label="Continue with Apple" />
                </div>
                <div className="my-5 text-center text-xs font-medium uppercase tracking-wider text-zinc-400">
                  or sign up with email
                </div>
              </>
            )}

            {/* Error banner */}
            {state?.error && (
              <div className="bg-red-50 text-red-700 text-xs p-3.5 border border-red-200 my-3 font-medium rounded-xl">
                {state.error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 my-4" noValidate>
              
              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-3">
                  <FieldBox
                    label="Organizer Secret Access Key"
                    name="organizerKey"
                    type="password"
                    value={formData.organizerKey}
                    onChange={handleChange}
                    error={errors.organizerKey}
                    placeholder="Enter secret key (e.g. SNIST2026)"
                  />

                  <FieldBox
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    error={errors.fullName}
                    autoComplete="name"
                    placeholder="e.g. Jane Smith"
                  />

                  <FieldBox
                    label="Work Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    autoComplete="email"
                    placeholder="e.g. organizer@hackos.io"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FieldBox
                      label="Designation / Role"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      error={errors.designation}
                      placeholder="e.g. Lead Organizer"
                    />
                    <FieldBox
                      label="Phone (Optional)"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-3">
                  <FieldBox
                    label="Organisation / College Name"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    error={errors.organizationName}
                    placeholder="e.g. Acme Corp / MIT / IEEE"
                  />

                  <FieldBox
                    label="Organisation Website (Optional)"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://yourorg.com"
                  />
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-3">
                  <FieldBox
                    label="Account Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                  />

                  <FieldBox
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                  />

                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-600 select-none">
                      <input
                        type="checkbox"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={handleChange}
                        className="mt-0.5 size-4 accent-[#E61E32] rounded"
                      />
                      <span>
                        I agree to the{" "}
                        <Link href="/terms" className="text-[#E61E32] underline underline-offset-2 font-medium">Terms of Service</Link>
                        {" "}and{" "}
                        <Link href="/privacy" className="text-[#E61E32] underline underline-offset-2 font-medium">Privacy Policy</Link>
                      </span>
                    </label>
                    {errors.agreeTerms && <p className="text-red-600 text-[11px] mt-1 font-medium pl-1">{errors.agreeTerms}</p>}
                  </div>
                </div>
              )}

              {/* Step Navigation Controls */}
              <div className="flex gap-3 pt-2">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 h-12 rounded-xl border border-zinc-300 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer shadow-2xs"
                  >
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 h-12 rounded-xl bg-zinc-950 text-sm sm:text-base font-medium text-white transition-all hover:bg-zinc-800 cursor-pointer shadow-sm"
                  >
                    Continue to Step {step + 1}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 h-12 rounded-xl bg-zinc-950 text-sm sm:text-base font-medium text-white transition-all hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </button>
                )}
              </div>
            </form>

            <p className="text-center text-xs text-zinc-500 mt-4">
              Already registered as an organizer?{" "}
              <Link href="/sign-in" className="text-[#E61E32] font-semibold hover:underline">
                Sign in
              </Link>
            </p>

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
              Empower builders,
              <br />
              Host greatness
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


