import type { Metadata } from "next";
import "./globals.css";
import { AppContextProvider } from "@/components/AppContext";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "ReadPapersFast",
  description: "Read research papers 10x faster",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased">
          <header className="flex absolute top-0 ml-auto w-full justify-end bg-transparent items-center p-4 gap-4 h-16">
            <SignedOut>
              <SignInButton>
                <Button className="bg-background/30 w-auto p-4 text-foreground cursor-pointer rounded-[3rem] hover:text-background">
                  Log In
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button className="bg-foreground w-auto p-4 text-background cursor-pointer rounded-[3rem] hover:text-foreground hover:bg-background/30">
                  Sign Up
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          <AppContextProvider>{children}</AppContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
