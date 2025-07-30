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
    <div className="fixed inset-0 bg-background/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className=" max-w-[90%] w-xl bg-white border border-foreground rounded-xl shadow-none">
        <PricingTable />
      </div>
    </div>
  );
}
