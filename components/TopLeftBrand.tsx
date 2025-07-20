"use client";
import Link from "next/link";

export default function TopLeftBrand() {
  return (
    <Link href="/" passHref>
      <button className="text-[1.25rem] pt-1 cursor-pointer text-foreground font-medium">
        shitcheck
      </button>
    </Link>
  );
}
