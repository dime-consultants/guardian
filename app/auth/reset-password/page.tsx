"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, HelpCircle, Loader2 } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useApp } from "@/contexts/app-context";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { requestPasswordReset, confirmPasswordReset } = useApp();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sendCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      setIsLoading(true);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address.");
      }
      await requestPasswordReset(email);
      setCodeSent(true);
      setMessage("Check your email for the reset code.");
    } catch (err: any) {
      setError(err.message || "Could not send reset code.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      setIsLoading(true);
      if (code.length !== 6) throw new Error("Enter the 6-digit code.");
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      await confirmPasswordReset(email, code, password);
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.message || "Could not reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle="Use your email to receive a one-time reset code."
      footer={
        <p className="text-center text-[13px] text-muted-foreground">
          Remembered it?{" "}
          <Link href="/auth/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      }
    >
      {error && (
        <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-[13px] text-primary">
          {message}
        </div>
      )}

      {!codeSent ? (
        <form onSubmit={sendCode} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[12px] text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
              className="h-10 rounded-md border-border bg-card text-[13px] shadow-sm"
            />
          </div>
          <Button disabled={isLoading || !email} className="h-10 w-full rounded-md text-[13px] font-semibold">
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            Send reset code
          </Button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label className="text-[12px] text-foreground">Reset code</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="size-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Use the newest code from your email.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <InputOTP maxLength={6} value={code} onChange={setCode} disabled={isLoading}>
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[12px] text-foreground">
              New password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter a new password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
                className="h-10 rounded-md border-border bg-card pr-10 text-[13px] shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-primary"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button disabled={isLoading || code.length !== 6 || !password} className="h-10 w-full rounded-md text-[13px] font-semibold">
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            Reset password
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isLoading}
            onClick={async () => {
              await requestPasswordReset(email);
              setMessage("A new reset code has been sent.");
            }}
            className="h-9 w-full text-[13px]"
          >
            Send a new code
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
