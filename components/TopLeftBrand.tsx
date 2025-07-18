"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopLeftBrand() {
  const pathname = usePathname();
  const isFactCheck = pathname.startsWith("/fact-check");
  return (
    <Link href="/" passHref>
      <button className="text-[1.25rem] pt-1 cursor-pointer text-foreground font-medium">
        {isFactCheck ? "Shit-Check" : "FindPapersFast"}
      </button>
    </Link>
  );
}
