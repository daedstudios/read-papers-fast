import { SidebarProvider } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import SidebarNav from "@/components/PaperComponents/SidebarNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SidebarProvider>{children}</SidebarProvider>;
}
