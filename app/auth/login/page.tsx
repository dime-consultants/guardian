"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, HelpCircle, Loader2, ShieldCheck } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useApp } from "@/contexts/app-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, requestEmailOtp, verifyEmailOtp } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
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
      if (err.requiresEmailVerification) {
        setNeedsVerification(true);
      }
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    try {
      setIsLoading(true);
      await verifyEmailOtp(email, otp);
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      setIsLoading(true);
      await requestEmailOtp(email);
    } catch (err: any) {
      setError(err.message || "Could not send a new code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Login"
      subtitle="We suggest using the email address you use at work."
      footer={
        <p className="text-center text-[13px] text-muted-foreground">
          You don't have an account yet?{" "}
          <Link href="/auth/signup" className="font-semibold text-primary">
            Sign up
          </Link>
        </p>
      }
    >
      {error && (
        <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
          {error}
        </div>
      )}

      {needsVerification ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-border bg-card p-3">
            <ShieldCheck className="mt-0.5 size-4 text-primary" />
            <div className="space-y-1 text-[13px]">
              <p className="font-medium text-foreground">Verify your email</p>
              <p className="text-muted-foreground">
                Enter the 6-digit code sent to {email}.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label className="text-[12px] text-foreground">Verification code</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="size-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>The code expires shortly and can only be used once.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={isLoading}>
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            type="button"
            disabled={isLoading || otp.length !== 6}
            onClick={handleVerify}
            className="h-10 w-full rounded-md bg-primary text-[13px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            Verify and login
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isLoading}
            onClick={handleResend}
            className="h-9 w-full text-[13px]"
          >
            Send a new code
          </Button>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[12px] text-foreground">
            Address email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isLoading}
            className="h-10 rounded-md border-border bg-card text-[13px] shadow-sm placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-ring/15"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[12px] text-foreground">
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
              className="h-10 rounded-md border-border bg-card pr-10 text-[13px] shadow-sm placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-ring/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          <div className="text-right">
            <Link href="/auth/reset-password" className="text-[12px] text-muted-foreground transition hover:text-primary">
              Forgot password
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !email || !password}
          className="h-10 w-full rounded-md bg-primary text-[13px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>
      )}
    </AuthShell>
  );
}
