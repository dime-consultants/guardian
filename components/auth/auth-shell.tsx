"use client";

import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  FileCheck2,
  Landmark,
  LockKeyhole,
  ReceiptText,
  type LucideProps,
} from "lucide-react";

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
    position: "left-[13%] top-[28%]",
    text: "Reconciliation queue",
  },
  {
    position: "left-[63%] top-[37%]",
    text: "Risk review",
    muted: true,
  },
  {
    position: "left-[66%] top-[49%]",
    text: "Verified ledger",
    muted: true,
  },
  {
    position: "left-[61%] top-[61%]",
    text: "Audit trail",
    muted: true,
  },
  {
    position: "left-[16%] top-[73%]",
    text: "Exception handling",
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
    <main className="auth-gradient grid min-h-screen overflow-y-auto overflow-x-hidden text-foreground lg:grid-cols-[minmax(440px,54%)_minmax(380px,46%)]">
      <section className="relative flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14">
        <AuthBrand />

        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[430px] flex-1 flex-col">
          <div className="flex flex-1 flex-col justify-center py-20">
            <AuthHeader title={title} subtitle={subtitle} />

            <div className="auth-panel w-full rounded-lg border border-white/70 p-4 shadow-sm backdrop-blur-xl sm:p-5">
              {children}
            </div>
            <div className="mt-6 w-full">{footer}</div>
          </div>

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
      className="absolute left-5 top-6 flex items-center gap-2.5 text-[17px] font-semibold tracking-normal text-foreground sm:left-10 lg:left-14"
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
    <header className="mb-6 text-center">
      <h1 className="text-[24px] font-semibold leading-tight tracking-normal text-foreground">
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-[330px] text-[13px] leading-5 text-muted-foreground">{subtitle}</p>
    </header>
  );
}

function AuthLegal({ children }: { children?: ReactNode }) {
  return (
    <p className="text-center text-[12px] leading-5 text-muted-foreground">
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
      className="auth-visual relative hidden min-h-screen overflow-hidden border-l border-white/70 lg:block"
      aria-hidden="true"
    >
      <div className="auth-grid-plane" />
      <VisualCard />

      {AUTH_VISUAL_CHIPS.map((chip) => (
        <VisualChip key={chip.text} {...chip} />
      ))}

      <div className="absolute bottom-[19%] left-[56%] flex size-12 -translate-x-1/2 items-center justify-center rounded-full border border-white/70 bg-card/70 shadow-[var(--shadow-soft)] backdrop-blur-md">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-[13px] font-semibold text-primary-foreground shadow-sm">
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
    <div className="bank-card-surface absolute left-[34%] top-[15%] w-[270px] rounded-lg border border-white/75 bg-card/80 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Landmark className="size-4" />
          </span>
          <div>
            <p className="text-[12px] font-semibold text-foreground">Guardian Ops</p>
            <p className="text-[10px] text-muted-foreground">Today, 09:42</p>
          </div>
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <MiniMetric label="Loans" value="1,284" />
        <MiniMetric label="Clean" value="98.2%" />
        <MiniMetric label="Flags" value="12" />
      </div>

      <div className="mt-4 space-y-2">
        <VisualRow icon={ReceiptText} label="Loan batches reconciled" tone="primary" />
        <VisualRow icon={FileCheck2} label="Dormancy exceptions reviewed" tone="gold" />
        <VisualRow icon={LockKeyhole} label="Access controls verified" tone="green" />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-background/60 px-2.5 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[13px] font-semibold leading-none text-foreground">{value}</p>
    </div>
  );
}

function VisualRow({
  icon: Icon,
  label,
  tone,
}: {
  icon: ComponentType<LucideProps>;
  label: string;
  tone: "primary" | "gold" | "green";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    gold: "bg-brand-accent/15 text-[color:var(--warning)]",
    green: "bg-success/10 text-success",
  }[tone];

  return (
    <div className="flex items-center justify-between rounded-md border border-border/70 bg-card/64 px-2.5 py-2">
      <div className="flex items-center gap-2">
        <span className={cn("flex size-6 items-center justify-center rounded-md", toneClass)}>
          <Icon className="size-3.5" />
        </span>
        <span className="text-[11px] text-foreground">{label}</span>
      </div>
      <CheckCircle2 className="size-3.5 text-success" />
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
        "absolute rounded-full border border-white/70 bg-card/75 px-4 py-2 text-[11px] font-medium shadow-sm backdrop-blur-md",
        muted ? "text-muted-foreground" : "text-foreground",
        position,
      )}
    >
      {text}
    </div>
  );
}
