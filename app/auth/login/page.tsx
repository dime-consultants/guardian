"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import {
  AuthDivider,
  AuthShell,
  ProviderButtons,
} from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/app-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      setIsLoading(true);

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address.");
      }

      if (!password) {
        throw new Error("Please enter your password.");
      }

      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Get started with Guardian"
      subtitle="Sign in to continue loan reconciliation, arrears verification, and account review."
      footer={
        <p className="text-center text-[13px] text-[#64748B]">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="font-semibold text-[#0F172A]">
            Sign up
          </Link>
        </p>
      }
    >
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[12px] text-[#0F172A]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isLoading}
            className="h-10 rounded-md border-[#E2E8F0] bg-white text-[13px] shadow-none placeholder:text-[#CBD5E1] focus-visible:border-[#0D3B8E] focus-visible:ring-[#0D3B8E]/15"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[12px] text-[#0F172A]">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              className="h-10 rounded-md border-[#E2E8F0] bg-white pr-10 text-[13px] shadow-none placeholder:text-[#CBD5E1] focus-visible:border-[#0D3B8E] focus-visible:ring-[#0D3B8E]/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] transition hover:text-[#0D3B8E]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !email || !password}
          className="h-10 w-full rounded-md bg-[#111111] text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.16)] hover:bg-[#0D3B8E]"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in with email"
          )}
        </Button>
      </form>

      <AuthDivider />
      <ProviderButtons />
    </AuthShell>
  );
}
