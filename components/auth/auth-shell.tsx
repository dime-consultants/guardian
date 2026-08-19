"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Landmark } from "lucide-react";

import { cn } from "@/lib/utils";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  legal?: ReactNode;
};

type VisualChipConfig = {
  text: string;
  position: string;
  muted?: boolean;
};

const AUTH_VISUAL_CHIPS: VisualChipConfig[] = [
  {
    position: "left-[38%] top-[33%]",
    text: "$ reconcile_loans --new",
  },
  {
    position: "left-[69%] top-[42%]",
    text: "#frontend {users-workflow}",
    muted: true,
  },
  {
    position: "left-[70%] top-[52%]",
    text: "#backend {provisioning}",
    muted: true,
  },
  {
    position: "left-[67%] top-[62%]",
    text: "#fullstack {audit-trail}",
    muted: true,
  },
  {
    position: "left-[18%] top-[69%]",
    text: "$ disbursements.scan + notifications",
    muted: true,
  },
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  legal,
}: AuthShellProps) {
  return (
    <main className="grid min-h-screen overflow-y-auto overflow-x-hidden bg-background text-foreground lg:grid-cols-[minmax(420px,56%)_minmax(360px,44%)]">
      <section className="relative flex min-h-screen px-6 py-7 sm:px-10 lg:px-14">
        <AuthBrand />

        <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[420px] flex-col justify-center pt-16">
          <AuthHeader title={title} subtitle={subtitle} />

          <div className="w-full">{children}</div>
          <div className="mt-6 w-full">{footer}</div>

          <AuthLegal>{legal}</AuthLegal>
        </div>
      </section>

      <AuthVisual />
    </main>
  );
}

function AuthBrand() {
  return (
    <Link
      href="/auth/login"
      className="absolute left-6 top-7 flex items-center gap-2.5 text-[17px] font-semibold tracking-normal text-foreground sm:left-10 lg:left-14"
    >
      <Image
        src="/Screenshot_2026-08-04_at_10.38.00-removebg-preview.png"
        alt="Guardian Bank"
        width={46}
        height={22}
        className="h-6 w-auto object-contain"
        priority
      />
      <span>Guardian</span>
    </Link>
  );
}

function AuthHeader({ title, subtitle }: Pick<AuthShellProps, "title" | "subtitle">) {
  return (
    <header className="mb-7 text-center">
      <h1 className="text-[21px] font-semibold leading-tight tracking-normal text-foreground">
        {title}
      </h1>
      <p className="mt-4 text-[13px] leading-5 text-muted-foreground">{subtitle}</p>
    </header>
  );
}

function AuthLegal({ children }: { children?: ReactNode }) {
  return (
    <p className="mt-auto pt-10 text-center text-[12px] leading-5 text-muted-foreground">
      {children ?? (
        <>
          By continuing, you agree to Guardian Financial Tool's{" "}
          <Link href="#" className="font-semibold text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="font-semibold text-foreground">
            Privacy Policy
          </Link>
        </>
      )}
    </p>
  );
}

function AuthVisual() {
  return (
    <aside
      className="auth-visual relative hidden min-h-screen overflow-hidden border-l border-border bg-card lg:block"
      aria-hidden="true"
    >
      <div className="auth-grid-plane" />
      <VisualCard />

      {AUTH_VISUAL_CHIPS.map((chip) => (
        <VisualChip key={chip.text} {...chip} />
      ))}

      <div className="absolute bottom-[19%] left-[56%] flex size-12 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card/70 shadow-[var(--shadow-soft)]">
        <span className="flex size-7 items-center justify-center rounded-[7px] bg-primary text-[13px] font-semibold text-primary-foreground shadow-sm">
          G
        </span>
      </div>
      <span className="auth-pulse auth-pulse-one" />
      <span className="auth-pulse auth-pulse-two" />
      <span className="auth-pulse auth-pulse-three" />
    </aside>
  );
}

function VisualCard() {
  return (
    <div className="absolute left-[46%] top-[17%] w-[205px] rounded-md border border-border bg-card/82 p-3 shadow-[var(--shadow-soft)] backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Landmark className="size-3.5 text-primary" />
        <div className="h-1.5 w-20 rounded-full bg-muted" />
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-2 w-full rounded-full bg-muted" />
        <div className="h-2 w-2/3 rounded-full bg-muted" />
      </div>
      <div className="mt-3 h-2.5 w-20 rounded-full bg-primary" />
    </div>
  );
}

function VisualChip({
  text,
  position,
  muted = false,
}: VisualChipConfig) {
  return (
    <div
      className={cn(
        "absolute rounded-full border border-border bg-card/82 px-4 py-2 font-mono text-[11px] shadow-sm backdrop-blur-sm",
        muted ? "text-muted-foreground" : "text-foreground",
        position,
      )}
    >
      {text}
    </div>
  );
}
