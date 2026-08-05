"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface KNLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function KNLogo({ className, showText = true, size = "md" }: KNLogoProps) {
  const sizeMap = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full border border-[rgb(2,3,129)]/15 bg-white shadow-sm",
          sizeMap[size],
        )}
      >
        <Image
          src="/Screenshot_2026-08-04_at_10.38.00-removebg-preview.png"
          alt="Guardian Bank logo"
          width={120}
          height={120}
          className="h-full w-full object-contain p-0.5"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-sm text-[rgb(2,3,129)]">
            Guardian Bank
          </span>
          <span className="text-[10px] text-[rgb(2,3,129)]/70 tracking-[0.22em] uppercase">
            Online Portal
          </span>
        </div>
      )}
    </div>
  );
}

export function KNLogoFull({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgb(2,3,129)]/15 bg-white shadow-sm">
        <Image
          src="/Screenshot_2026-08-04_at_10.38.00-removebg-preview.png"
          alt="Guardian Bank logo"
          width={120}
          height={120}
          className="h-full w-full object-contain p-0.5"
        />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[20px] font-bold tracking-[0.16em] text-[rgb(2,3,129)]">
          GUARDIAN BANK
        </span>
        <span className="text-[9px] font-medium tracking-[0.3em] text-[rgb(2,3,129)]/70 uppercase">
          Secure digital banking
        </span>
      </div>
    </div>
  );
}
