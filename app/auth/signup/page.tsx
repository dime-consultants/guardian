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

const initialForm = {
  email: "",
  password: "",
  confirmPassword: "",
  first_name: "",
  last_name: "",
  department: "",
  phone: "",
};

export default function SignupPage() {
  const router = useRouter();
  const { signup, requestEmailOtp, verifyEmailOtp } = useApp();

  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const {
      email,
      password,
      confirmPassword,
      first_name,
      last_name,
      department,
      phone,
    } = formData;

    try {
      setIsLoading(true);

      if (!email || !password || !first_name || !last_name || !department || !phone) {
        throw new Error("All fields are required.");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address.");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      await signup({
        email,
        password,
        password2: confirmPassword,
        first_name,
        last_name,
        department,
        phone,
      });

      setNeedsVerification(true);
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    try {
      setIsLoading(true);
      await verifyEmailOtp(formData.email, otp);
      router.push("/auth/login");
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
      await requestEmailOtp(formData.email);
    } catch (err: any) {
      setError(err.message || "Could not send a new code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your Guardian account"
      subtitle="Join Guardian Financial Tool securely with your work profile."
      footer={
        <p className="text-center text-[13px] text-muted-foreground">
          Already have an account?{" "}
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

      {needsVerification ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-border bg-card p-3">
            <ShieldCheck className="mt-0.5 size-4 text-primary" />
            <div className="space-y-1 text-[13px]">
              <p className="font-medium text-foreground">Check your email</p>
              <p className="text-muted-foreground">
                Enter the one-time code for {formData.email}.
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
                  <p>This keeps unverified emails out of active accounts.</p>
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
            disabled={isLoading || otp.length < 5}
            onClick={handleVerify}
            className="h-10 w-full rounded-md bg-primary text-[13px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            Verify account
          </Button>
          <Button type="button" variant="ghost" disabled={isLoading} onClick={handleResend} className="h-9 w-full text-[13px]">
            Send a new code
          </Button>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="auth-scroll max-h-[52vh] space-y-3 overflow-y-auto pr-1 sm:max-h-none sm:overflow-visible sm:pr-0">
        <div className="grid gap-3 sm:grid-cols-2">
          <AuthField
            id="first_name"
            label="First name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            disabled={isLoading}
          />
          <AuthField
            id="last_name"
            label="Last name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <AuthField
          id="email"
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
        />

        <PasswordField
          id="password"
          label="Password"
          name="password"
          value={formData.password}
          visible={showPassword}
          onToggle={() => setShowPassword((value) => !value)}
          onChange={handleChange}
          disabled={isLoading}
        />

        {formData.password && (
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${passwordStrength.value}%`,
                backgroundColor: passwordStrength.color,
              }}
            />
          </div>
        )}

        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          name="confirmPassword"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          visible={showConfirmPassword}
          onToggle={() => setShowConfirmPassword((value) => !value)}
          onChange={handleChange}
          disabled={isLoading}
        />

        <AuthField
          id="department"
          label="Department"
          name="department"
          placeholder="Department"
          value={formData.department}
          onChange={handleChange}
          disabled={isLoading}
        />

        <AuthField
          id="phone"
          label="Phone"
          name="phone"
          type="tel"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          disabled={isLoading}
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full rounded-md bg-primary text-[13px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
      )}
    </AuthShell>
  );
}

type AuthFieldProps = {
  id: string;
  label: string;
  name: string;
  value: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function AuthField({
  id,
  label,
  name,
  value,
  type = "text",
  placeholder,
  disabled,
  onChange,
}: AuthFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[12px] text-foreground">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder ?? label}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-10 rounded-md border-border bg-card text-[13px] shadow-sm placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-ring/15"
      />
    </div>
  );
}

type PasswordFieldProps = AuthFieldProps & {
  visible: boolean;
  onToggle: () => void;
};

function PasswordField({
  id,
  label,
  name,
  value,
  placeholder = "Enter your password",
  visible,
  disabled,
  onToggle,
  onChange,
}: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[12px] text-foreground">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="h-10 rounded-md border-border bg-card pr-10 text-[13px] shadow-sm placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-ring/15"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-primary"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

function getPasswordStrength(password: string) {
  if (!password) return { value: 0, color: "var(--border)" };

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*(),.?":{}|<>]/.test(password),
  ];

  const value = checks.filter(Boolean).length * 25;

  if (value <= 25) return { value, color: "var(--destructive)" };
  if (value <= 75) return { value, color: "var(--warning)" };

  return { value, color: "var(--success)" };
}
