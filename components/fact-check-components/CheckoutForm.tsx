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
    <div className="fixed inset-0 bg-foreground/30 bg-blur-lg">
      <Card className="w-full max-w-md bg-white border border-foreground rounded-sm shadow-none relative">
        <CardHeader>
          <CardTitle>Subscribe to Base Plan</CardTitle>
          <CardDescription>
            Get access to premium features with our base subscription plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* <SignedIn>
            <CheckoutButton planId="cplan_30Xo9mZqGa9s1xw264aUtpL2J1p" />
          </SignedIn> */}
          <PricingTable />
        </CardContent>
      </Card>
    </div>
  );
}
