"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";

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
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white border border-foreground rounded-sm shadow-none">
        <CardHeader className="relative">
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-8 w-8 p-0"
              onClick={onClose}
            >
              <X size={16} />
            </Button>
          )}
          <CardTitle className="text-2xl text-center">
            Get unlimited searches
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center mt-2">
            You have used {2 - remainingSearches} of 2 free searches. Sign up to
            continue fact-checking unlimited claims.
          </p>
          <div className="text-center mt-3 px-4 py-2 bg-green-50 rounded-sm border border-green-200">
            <p className="text-xs text-green-700 font-medium">
              🎉 No credit card required • 100% free forever
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <SignedOut>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <SignUpButton>
                  <Button className="w-full py-3 rounded-sm border border-foreground bg-foreground text-background hover:bg-foreground/90">
                    Sign Up - Free Forever
                  </Button>
                </SignUpButton>

                <div className="text-center text-xs text-muted-foreground">
                  No credit card • Takes 30 seconds
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  or
                </div>

                <SignInButton>
                  <Button
                    variant="outline"
                    className="w-full py-3 rounded-sm border border-foreground bg-background text-foreground hover:bg-muted"
                  >
                    Log In
                  </Button>
                </SignInButton>
              </div>

              <div className="mt-6 pt-4 border-t border-muted">
                <h4 className="text-sm font-medium mb-2">
                  With your free account, you get:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    •{" "}
                    <span className="font-medium text-green-600">
                      Unlimited
                    </span>{" "}
                    fact-checking searches
                  </li>
                  <li>• Access to 200M+ research papers</li>
                  <li>• Detailed analysis reports</li>
                  <li>• Shareable fact-check results</li>
                  <li>• Priority support</li>
                </ul>
                <div className="mt-3 text-xs text-center text-muted-foreground">
                  Always free • No subscription • No hidden fees
                </div>
              </div>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="text-center space-y-4">
              <div className="text-green-600 text-lg">✅ You're signed in!</div>
              <p className="text-sm text-muted-foreground">
                You now have unlimited access to fact-checking searches.
              </p>
              <Button
                onClick={handleSuccess}
                className="w-full py-3 rounded-sm border border-foreground bg-foreground text-background"
              >
                Continue
              </Button>
            </div>
          </SignedIn>
        </CardContent>
      </Card>
    </div>
  );
}
