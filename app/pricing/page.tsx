"use client";

import { PricingTable, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import posthog from "posthog-js";

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

  useEffect(() => {
    // Track when pricing page is viewed (payment flow initiated)
    posthog.capture("payment_triggered", {
      location: "pricing_page",
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Don't render if user already has base plan
  if (hasPlanBase) {
    return null;
  }

  return (
    <div className="fixed flex flex-col inset-0  items-center z-0 max-h-[90vh] justify-center p-4">
      <h1 className="text-[1.5rem] max-w-[90%] w-xl text-center pb-8 font-medium">
        Just a few clicks away from unlimited fact checks
      </h1>
      <div className="max-w-[90%] w-xl bg-white border border-foreground rounded-sm shadow-none">
        <PricingTable
          appearance={{
            elements: {
              root: {
                borderRadius: "1px",
              },
              card: {
                backgroundColor: "white",
                borderRadius: "133px",
                border: "1px solid #000000",
                boxShadow: "none",
                padding: "1rem",

                cursor: "pointer",
                transition: "all 0.2s ease",
              },
              input: {
                backgroundColor: "white",
                border: "1px solid #000000",
                borderRadius: "0.125rem",
              },
              button: {
                backgroundColor: "#C5C8FF",
                color: "black",
                borderRadius: "0",
                fontWeight: "600",
                padding: "0.75rem 1rem",
                margin: "0",
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: "1px solid #000000",
                fontSize: "1.25rem",
              },
              header: {
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#000000",
              },
              price: {
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#000000",
              },
              description: {
                color: "#666666",
                fontSize: "0.875rem",
              },
            },
          }}
        />
      </div>
    </div>
  );
}
