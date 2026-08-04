"use client";

import { cn } from "@/lib/utils";

interface KNLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function KNLogo({ className, showText = true, size = "md" }: KNLogoProps) {
  const sizeMap = {
    sm: "h-6 w-6 text-[9px]",
    md: "h-8 w-8 text-[10px]",
    lg: "h-10 w-10 text-[11px]",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full border border-[#348fe2]/25 bg-[linear-gradient(135deg,#348fe2,#246fbe)] text-white font-black shadow-sm",
          sizeMap[size],
        )}
      >
        GB
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-sm text-[#0d4b8f]">
            Guardian Bank
          </span>
          <span className="text-[10px] text-[#4a7ba8] tracking-[0.22em] uppercase">
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
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#348fe2]/25 bg-[linear-gradient(135deg,#348fe2,#246fbe)] text-white font-black shadow-sm">
        GB
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[20px] font-bold tracking-[0.16em] text-[#0d4b8f]">
          GUARDIAN BANK
        </span>
        <span className="text-[9px] font-medium tracking-[0.3em] text-[#4a7ba8] uppercase">
          Secure digital banking
        </span>
      </div>
    </div>
  );
}
