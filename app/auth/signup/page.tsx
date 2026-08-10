"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useApp } from "@/contexts/app-context";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useApp();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    department: "",
    phone: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const { email, password, confirmPassword, first_name, last_name, department, phone } = formData;

    try {
      setIsLoading(true);

      if (!email || !password || !first_name || !last_name || !department || !phone) {
        throw new Error("All fields are required");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
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

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8F9FB] text-[#2B2B2B]">
      <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-5 sm:px-6">
        <div className="w-full max-w-[540px]">
            <div className="mb-3 flex justify-center">
             <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-[0_14px_36px_rgba(13,59,142,0.14)]">
              <Image
                src="/Screenshot_2026-08-04_at_10.38.00-removebg-preview.png"
                alt="Guardian Bank icon"
                width={420}
                height={420}
                className="h-[160px] w-[160px] object-contain"
                priority
              />
            </div>
          </div>

          <div
            className="auth-scroll flex flex-col overflow-y-auto rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_36px_rgba(13,59,142,0.10)] sm:p-6"
            style={{ height: 370 }}
          >
            <div className="mb-5 text-center">
              <h1 className="text-[36px] font-bold tracking-tight text-[#2B2B2B]">
                Create account
              </h1>
              <p className="mt-2 text-base text-[#6B7280]">
                Join Guardian Financial Tool securely
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-base text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex grow flex-col space-y-3.5">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="mb-1 block text-base font-medium text-[#2B2B2B]">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-base text-[#2B2B2B] placeholder:text-[#6B7280] focus:border-[#0D3B8E] focus:outline-none focus:ring-2 focus:ring-[#0D3B8E]/30"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="mb-1 block text-base font-medium text-[#2B2B2B]">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-base text-[#2B2B2B] placeholder:text-[#6B7280] focus:border-[#0D3B8E] focus:outline-none focus:ring-2 focus:ring-[#0D3B8E]/30"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-base font-medium text-[#2B2B2B]">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-base text-[#2B2B2B] placeholder:text-[#6B7280] focus:border-[#0D3B8E] focus:outline-none focus:ring-2 focus:ring-[#0D3B8E]/30"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-base font-medium text-[#2B2B2B]">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 pr-10 text-base text-[#2B2B2B] placeholder:text-[#6B7280] focus:border-[#0D3B8E] focus:outline-none focus:ring-2 focus:ring-[#0D3B8E]/30"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#0D3B8E]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-base font-medium text-[#2B2B2B]">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 pr-10 text-base text-[#2B2B2B] placeholder:text-[#6B7280] focus:border-[#0D3B8E] focus:outline-none focus:ring-2 focus:ring-[#0D3B8E]/30"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-[#0D3B8E]"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="department" className="mb-1 block text-base font-medium text-[#2B2B2B]">
                  Department
                </label>
                <input
                  id="department"
                  type="text"
                  name="department"
                  placeholder="Department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-base text-[#2B2B2B] placeholder:text-[#6B7280] focus:border-[#0D3B8E] focus:outline-none focus:ring-2 focus:ring-[#0D3B8E]/30"
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-1 block text-base font-medium text-[#2B2B2B]">
                  Phone
                </label>
                <input
                  id="phone"
                  type="number"
                  name="phone"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-base text-[#2B2B2B] placeholder:text-[#6B7280] focus:border-[#0D3B8E] focus:outline-none focus:ring-2 focus:ring-[#0D3B8E]/30"
                />
              </div>

              <div className="mt-auto pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-[#0D3B8E] p-3 text-lg font-semibold text-white transition-all duration-300 hover:bg-[#1F5FBF] disabled:cursor-not-allowed disabled:opacity-90"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>

            <p className="mt-4 text-center text-base text-[#6B7280]">
              Already have an account?
              <Link
                href="/auth/login"
                className="ml-2 font-semibold text-[#0D3B8E] hover:text-[#1F5FBF]"
              >
                Sign In
              </Link>
            </p>
          </div>

          <p className="mt-3 text-center text-sm text-[#6B7280]">
            © {new Date().getFullYear()} Guardian Financial Tool
          </p>
        </div>
      </div>
    </div>
  );
}
