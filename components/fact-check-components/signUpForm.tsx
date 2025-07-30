"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import posthog from "posthog-js";

interface SignUpFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
  remainingSearches?: number;
}

export default function SignUpForm({
  onClose,
  onSuccess,
  remainingSearches = 0,
}: SignUpFormProps) {
  const handleSuccess = () => {
    posthog.capture("sign_up_completed", {
      timestamp: new Date().toISOString(),
      // Optionally add more user info here if available
    });
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleSignUpClick = () => {
    posthog.capture("sign_up_clicked", {
      timestamp: new Date().toISOString(),
      remainingSearches,
    });
  };

  return (
    <div className="fixed inset-0  bg-foreground/30 bg-blur-lg flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white border border-foreground rounded-sm shadow-none">
        <CardHeader className="relative">
          <CardTitle className="text-[1.5rem] font-bold text-center">
            Keep Fact-Checking – It’s Free
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Sign up for free to continue fact-checking unlimited claims.
          </p>
        </CardHeader>

        <CardContent>
          <SignedOut>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <SignUpButton forceRedirectUrl={"/pricing"}>
                  <Button
                    className="w-full py-5 text-[1rem] rounded-none border border-foreground bg-foreground text-background hover:bg-foreground/90"
                    onClick={handleSignUpClick}
                  >
                    Sign Up for free
                  </Button>
                </SignUpButton>

                <div className="text-center text-xs text-muted-foreground">
                  No credit card required (takes 30 seconds)
                </div>

                <div className="text-center text-sm text-foreground">or</div>

                <SignInButton forceRedirectUrl={"/pricing"}>
                  <Button
                    variant="outline"
                    className="w-full py-5 text-[1rem] rounded-none border border-foreground bg-background text-foreground hover:bg-[#C5C8FF]"
                  >
                    Log in if you already have an account
                  </Button>
                </SignInButton>
              </div>
              <div className="mt-3 text-muted-foreground text-center text-sm">
                Trusted by hundreds of curious minds
              </div>
            </div>
          </SignedOut>
        </CardContent>
      </Card>
    </div>
  );
}
