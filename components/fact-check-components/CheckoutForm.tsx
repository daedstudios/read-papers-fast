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
    <div className="fixed inset-0 h-screen w-screen p-40">
      <PricingTable />
    </div>
  );
}
