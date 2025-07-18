import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const isFactCheck = pathname.startsWith("/fact-check");
  return (
    <div className="sticky p-[1rem] bg-background w-full left-[1rem] text-[1.25rem] z-3  text-foreground font-medium">
      {isFactCheck ? "Shit-Check" : "ReadPapersFast"}
    </div>
  );
}
