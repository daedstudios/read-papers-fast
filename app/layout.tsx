import type { Metadata } from "next";
import "./globals.css";
import { AppContextProvider } from "@/components/AppContext";

export const metadata: Metadata = {
  title: "Read papers fast",
  description: "Read research papers 10x faster",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppContextProvider>{children}</AppContextProvider>
      </body>
    </html>
  );
}
