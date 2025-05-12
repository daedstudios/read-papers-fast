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
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";

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
          <header className="flex flex-row absolute m-[1rem] w-screen justify-between bg-transparent h-16">
            <Link href="/" passHref>
              <button className="text-[1.25rem] pt-1 cursor-pointer text-foreground font-medium">
                ReadPapersFast
              </button>
            </Link>
            <div className="flex flex-row gap-4 px-[1rem]">
              <SignedOut>
                <SignInButton>
                  <Button className="bg-background/30 w-auto p-4 text-foreground cursor-pointer rounded-[3rem] border border-muted/30 hover:bg-background/10 hover:text-background">
                    Log In
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button className="bg-foreground w-auto p-4 text-background cursor-pointer rounded-[3rem]  hover:bg-foreground/30">
                    Sign Up
                  </Button>
                </SignUpButton>
              </SignedOut>
              <div className="z-100">
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
            </div>
          </header>
          <AppContextProvider>{children}</AppContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
