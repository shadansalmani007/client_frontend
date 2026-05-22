import { BusFront } from "lucide-react";

export default function BrandLogo({ size = "md" }) {
  const box = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <a href="/" className="flex flex-shrink-0 items-center gap-2">
      <div className={`${box} flex items-center justify-center rounded-lg bg-[#c0392b]`}>
        <BusFront className={`${icon} text-white`} aria-hidden="true" />
      </div>
      <span className={`${size === "sm" ? "text-sm" : "text-lg"} font-bold text-[#c0392b] tracking-[-0.3px]`}>
        Likili <span className="text-[#2c3e50]">Moterways</span>
      </span>
    </a>
  );
}
