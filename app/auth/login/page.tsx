"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useApp } from "@/contexts/app-context";

export default function LoginFormEnhanced() {
  const router = useRouter();
  const { login, signup } = useApp();
  const [isLoginMode, setIsLoginMode] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { text: "", value: 0 };

    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let score = 0;

    if (password.length >= 8) score += 25;
    if (hasUppercase) score += 25;
    if (hasNumber) score += 25;
    if (hasSpecial) score += 25;

    if (score <= 25) return { text: "Weak", value: score };
    if (score <= 75) return { text: "Medium", value: score };

    return { text: "Strong", value: score };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      setIsLoading(true);

      if (!validateEmail(email)) {
        throw new Error("Please enter a valid email address.");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long.");
      }

      if (isLoginMode) {
        await login(email, password);
        setSuccess("Login successful!");
        router.push("/");
      } else {
        if (!fullName.trim()) {
          throw new Error("Please enter your full name.");
        }

        if (!department.trim()) {
          throw new Error("Please enter your department.");
        }

        if (!phone.trim()) {
          throw new Error("Please enter your phone number.");
        }

        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const [first_name, ...lastNameParts] = fullName.trim().split(" ");
        const last_name = lastNameParts.join(" ") || "";

        await signup({
          email,
          password,
          password2: confirmPassword,
          first_name,
          last_name,
          department,
          phone,
        });

        setSuccess("Account created successfully!");
        setIsLoginMode(true);
      }

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5FAFE] text-[#0f172a]">
      <div className="absolute inset-y-0 left-0 w-1/2 bg-blue-900" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[#F5FAFE]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[520px]">
          <div className="mb-3 flex justify-center">
            <div className="flex h-64 w-64 items-center justify-center rounded-full bg-white shadow-[0_14px_36px_rgba(52,143,226,0.18)]">
              <Image
                src="/Screenshot_2026-08-04_at_10.38.00-removebg-preview.png"
                alt="Guardian Bank icon"
                width={560}
                height={560}
                className="h-[280px] w-[280px] object-contain"
                priority
              />
            </div>
          </div>

          <div className="mb-5 text-center">
            <div className="relative">
              <h1 className="text-[36px] font-bold tracking-tight text-black">
                {isLoginMode ? "Welcome back" : "Create your account"}
              </h1>
              <h1
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 text-[36px] font-bold tracking-tight text-white [clip-path:inset(0_50%_0_0)]"
              >
                {isLoginMode ? "Welcome back" : "Create your account"}
              </h1>
            </div>
            <p className="mt-2 text-base text-[#64748b]">
              {isLoginMode
                ? "Enter your details to sign in"
                : "Start secure banking with Guardian Bank"}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-base text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-base text-emerald-700">
              {success}
            </div>
          )}

          <div className="relative mb-6 flex h-12 overflow-hidden rounded-full border border-blue-900/20 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setIsLoginMode(true)}
              className={`z-10 w-1/2 text-base font-medium transition-all ${
                isLoginMode ? "text-white" : "text-blue-900"
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => setIsLoginMode(false)}
              className={`z-10 w-1/2 text-base font-medium transition-all ${
                !isLoginMode ? "text-white" : "text-blue-900"
              }`}
            >
              Sign Up
            </button>

            <div
              className={`absolute top-0 h-full w-1/2 rounded-full bg-blue-900 transition-all duration-300 ${
                isLoginMode ? "left-0" : "left-1/2"
              }`}
            />
          </div>

          <div
            className="auth-scroll overflow-y-auto rounded-[26px] border border-blue-900/15 bg-white p-5 shadow-[0_12px_36px_rgba(30,58,138,0.10)] sm:p-6"
            style={{ height: 370 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginMode && (
                <div>
                  <label htmlFor="fullName" className="mb-1 block text-base font-medium text-[#0f172a]">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-[#e2e8f0] bg-white p-3 text-base text-[#0f172a] placeholder:text-[#64748b] focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/30"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1 block text-base font-medium text-[#0f172a]">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(error && !validateEmail(email))}
                  aria-describedby="email-error"
                  className="w-full rounded-xl border border-[#e2e8f0] bg-white p-3 text-base text-[#0f172a] placeholder:text-[#64748b] focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/30"
                />
                {email && !validateEmail(email) && (
                  <p id="email-error" className="mt-1 text-sm text-red-500">
                    Please enter a valid email address.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-base font-medium text-[#0f172a]">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#e2e8f0] bg-white p-3 pr-10 text-base text-[#0f172a] placeholder:text-[#64748b] focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/30"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-blue-900"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {password && (
                <div className="h-2 overflow-hidden rounded-full bg-blue-900/10">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${strength.value}%`,
                      backgroundColor:
                        strength.text === "Weak"
                          ? "#ef4444"
                          : strength.text === "Medium"
                            ? "#f59e0b"
                            : "#22c55e",
                    }}
                  />
                </div>
              )}

              {!isLoginMode && (
                <>
                  <div>
                    <label htmlFor="confirmPassword" className="mb-1 block text-base font-medium text-[#0f172a]">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#e2e8f0] bg-white p-3 pr-10 text-base text-[#0f172a] placeholder:text-[#64748b] focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/30"
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-blue-900"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="department" className="mb-1 block text-base font-medium text-[#0f172a]">
                      Department
                    </label>
                    <input
                      id="department"
                      type="text"
                      placeholder="Department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-xl border border-[#e2e8f0] bg-white p-3 text-base text-[#0f172a] placeholder:text-[#64748b] focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/30"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-1 block text-base font-medium text-[#0f172a]">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="text"
                      placeholder="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-[#e2e8f0] bg-white p-3 text-base text-[#0f172a] placeholder:text-[#64748b] focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/30"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between text-base">
                <label className="flex items-center gap-2 text-[#64748b]">
                  <input type="checkbox" className="h-5 w-5 rounded border-[#cbd5e1] text-blue-900 focus:ring-blue-900" />
                  Remember me
                </label>
                <a href="#" className="text-blue-900 hover:text-blue-800">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password || (!isLoginMode && (!fullName || !department || !phone || !confirmPassword))}
                className="w-full rounded-xl bg-blue-900 p-3 text-lg font-semibold text-white transition-all duration-300 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-90"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Processing...
                  </span>
                ) : isLoginMode ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-base text-[#64748b]">
              {isLoginMode ? "Don’t have an account?" : "Already have one?"}
              <button
                className="ml-2 font-semibold text-blue-900 hover:text-blue-800"
                onClick={() => setIsLoginMode(!isLoginMode)}
                type="button"
              >
                {isLoginMode ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

