"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Github } from "lucide-react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  legal?: ReactNode;
};

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  legal,
}: AuthShellProps) {
  return (
    <main className="auth-gradient relative flex min-h-screen overflow-y-auto overflow-x-hidden bg-background px-5 py-8 text-foreground sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[356px] flex-col items-center justify-center">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-white shadow-[0_14px_30px_rgba(13,59,142,0.14)] ring-1 ring-[#E2E8F0]/75">
          <Image
            src="/Screenshot_2026-08-04_at_10.38.00-removebg-preview.png"
            alt="Guardian Bank"
            width={72}
            height={72}
            className="h-10 w-10 object-contain"
            priority
          />
        </div>

        <header className="mb-7 text-center">
          <h1 className="text-[22px] font-semibold leading-tight tracking-normal text-[#0F172A]">
            {title}
          </h1>
          <p className="mt-2 text-[14px] leading-5 text-[#64748B]">
            {subtitle}
          </p>
        </header>

        <div className="w-full">{children}</div>
        <div className="mt-6 w-full">{footer}</div>

        <PartnerAccess />

        <p className="mt-auto pt-10 text-center text-[12px] leading-5 text-[#64748B]">
          {legal ?? (
            <>
              By continuing, you agree to Guardian Financial Tool's{" "}
              <Link href="#" className="font-semibold text-[#0F172A]">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="font-semibold text-[#0F172A]">
                Privacy Policy
              </Link>
            </>
          )}
        </p>
      </section>
    </main>
  );
}

export function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-[11px] uppercase text-[#94A3B8]">
      <span className="h-px flex-1 bg-[#E2E8F0]" />
      <span>OR</span>
      <span className="h-px flex-1 bg-[#E2E8F0]" />
    </div>
  );
}

export function ProviderButtons() {
  return (
    <div className="space-y-2">
      <ProviderButton label="Continue with Google" icon={<GoogleMark />} />
      <ProviderButton label="Continue with Apple" icon={<AppleMark />} />
      <ProviderButton
        label="Continue with GitHub"
        icon={<Github className="size-3.5 text-[#0F172A]" />}
      />
    </div>
  );
}

function ProviderButton({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <button
      type="button"
      disabled
      className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#E2E8F0] bg-white text-[13px] font-medium text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition disabled:cursor-not-allowed disabled:opacity-100"
    >
      {icon}
      {label}
    </button>
  );
}

function GoogleMark() {
  return (
    <span className="text-[15px] font-semibold leading-none text-[#4285F4]">
      G
    </span>
  );
}

function AppleMark() {
  return (
    <span className="h-3.5 w-3.5 rounded-full bg-[#0F172A]" aria-hidden="true" />
  );
}

function PartnerAccess() {
  return (
    <div className="mt-9 w-full rounded-md border border-[#E2E8F0] bg-white/80 px-4 py-3 text-center shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <p className="text-[12px] leading-4 text-[#475569]">
        Looking for your Guardian partner account?
      </p>
      <Link
        href="/auth/login"
        className="text-[12px] font-semibold leading-4 text-[#0F172A]"
      >
        Log in at partners.guardian-bank.app
      </Link>
    </div>
  );
}
