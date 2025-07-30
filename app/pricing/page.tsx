"use client";

import { PricingTable, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PricingPage() {
  const { has } = useAuth();
  const router = useRouter();
  console.log("User has plans:", has);
  const hasPlanBase = has ? has({ plan: "base" }) : false;

  useEffect(() => {
    if (hasPlanBase) {
      router.push("/");
    }
  }, [hasPlanBase, router]);

  // Don't render if user already has base plan
  if (hasPlanBase) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-[90%] w-xl bg-white border border-foreground rounded-sm shadow-none">
        <PricingTable />
      </div>
    </div>
  );
}
