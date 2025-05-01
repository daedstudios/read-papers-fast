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
              <SignInButton />
              <SignUpButton />
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
