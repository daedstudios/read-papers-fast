"use client";

import { PricingTable, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { X } from "lucide-react";

export default function CheckoutForm({ onClose }: { onClose?: () => void }) {
  return (
    <div className="fixed inset-0 bg-background/30 backdrop-blur-sm flex items-center justify-center z-0 p-4">
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
